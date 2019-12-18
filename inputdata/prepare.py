'''Script for normalizing and combining ISO-NE hourly profiles

Takes in CSV files and produces CSV.
'''

import csv
import numpy


# Raw data was downloaded from 
# https://www.iso-ne.com/isoexpress/web/reports/load-and-demand/-/tree/zone-info
# https://www.iso-ne.com/isoexpress/web/reports/operations/-/tree/daily-gen-fuel-type
# and manually exported to CSV and concatenated together to produce these CSV files.
DEMAND_FILE = 'iso-ne-hourly-demand-2011-2018.csv'
SOLAR_FILE = 'iso-ne-hourly-solar-2011-2018.csv'
WIND_FILE = 'iso-ne-hourly-wind-2011-2018.csv'

OUTPUT_FILE = 'iso-ne-hourly-demand-solar-wind-2013-2018.csv'

series = []

def NormalizeDateHour(d, hour):
    parts = d.split('/')
    if len(parts) != 3:
        parts = d.split('-')
    assert(len(parts) == 3)

    try:
        int(parts[1])
    except:
        m = parts[1].lower()
        if m.startswith('jan'):
            m = 1
        elif m.startswith('feb'):
            m = 2
        elif m.startswith('mar'):
            m = 3
        elif m.startswith('apr'):
            m = 4
        elif m.startswith('may'):
            m = 5
        elif m.startswith('jun'):
            m = 6
        elif m.startswith('jul'):
            m = 7
        elif m.startswith('aug'):
            m = 8
        elif m.startswith('sep'):
            m = 9
        elif m.startswith('oct'):
            m = 10
        elif m.startswith('nov'):
            m = 11
        elif m.startswith('dec'):
            m = 12
        else:
            assert(False)
        parts[1] = parts[0]
        parts[0] = m

    normdate = '{:04d}{:02d}{:02d}{:02d}'.format(int(parts[2]) + 2000, int(parts[0]), int(parts[1]), hour)
    
    return normdate

def FloatQuantity(x):
    if x == '':
        x = 0.0
    else:
        x = float(x.replace(',', ''))
    return x

def IntQuantity(x):
    if x == '':
        x = 0
    else:
        x = int(x)
    return x

def MergeSeries(demand, solar, wind):
    inputs = [demand, solar, wind]
    indices = [1, 1, 1]

    series = [['DATEHOUR', 'DEMAND', 'SOLAR', 'WIND']]
    while True:
        row = []
        for i in range(len(inputs)):
            if indices[i] < len(inputs[i]):
                if len(row) == 0:
                    row.append(inputs[i][indices[i]][0])
                    row.append(inputs[i][indices[i]][1])
                    indices[i] += 1
                else:
                    val = inputs[i][indices[i]][1]
                    if row[0] == inputs[i][indices[i]][0]:
                        row.append(inputs[i][indices[i]][1])
                        indices[i] += 1
                    else:
                        assert row[0] < inputs[i][indices[i]][0], 'i={:d}, line={:d}, row={}, inputs={}'.format(i, indices[i], row[0], inputs[i][indices[i]][0])
                        # missing data point, repeat previous value and don't increment index.
                        row.append(inputs[i][indices[i] - 1][1])
            else:
                print('input {} at end index {}'.format(i, indices[i]))
        if len(row) == 0:
            break
        series.append(row)
        
    return series

def EstimateCapacity(t, maxes):
    # Look at the maximum six months ahead; should be a
    # good/conservative proxy for installed capacity.
    #plus_t = min(t + 4380, len(maxes) - 1)
    plus_t = min(t + 30 * 24, len(maxes) - 1)  #xxxx 1 month ahead?
    return maxes[plus_t]


def NormalizeGenerationProfile(profile, annual_capacity_factor):
    '''Modify profile in place.
    '''

    values = [float(elem[1]) for elem in profile[1:]]

    # Divide out capacity growth so peak capacity is at 1000
    maxes = numpy.maximum.accumulate(values)

    out = numpy.zeros(len(values), dtype=int)
    for i in range(len(values)):
        capest = EstimateCapacity(i, maxes)
        profile[i + 1][1] = int(round(values[i] * 1000.0 / capest))
        values[i] = profile[i + 1][1]

    # Normalize CF by year
    cumsum = numpy.cumsum(values)
    annual_avg = []
    for i in range(0, len(values)):
        i1 = min(i + 8760, len(values) - 1)
        if i1 > i + 4380:
            annual_avg.append((cumsum[i1] - cumsum[i]) / (i1 - i))
            cf_adjust = annual_capacity_factor / (annual_avg[-1] / 1000.0)
            values[i] = min(1000, int(round(values[i] * cf_adjust)))
            profile[i + 1][1] = values[i]
        
    # Print capacity factors per year
    print("==")
    for i in range(0, len(values), 8760):
        cf = numpy.sum(values[i: i + 8760]) / (8760 * 1000)
        print("CF[" + str(i) + "]: " + str(cf))


def NormalizeDemandProfile(profile):
    '''Modify profile in place.
    '''
    # Compute annual averages
    values = [float(elem[1]) for elem in profile[1:]]
    cumsum = numpy.cumsum(values)
    annual_avg = []
    for i in range(0, len(values), 8760):
        i1 = min(i + 8760, len(values) - 1)
        annual_avg.append((cumsum[i1] - cumsum[i]) / (i1 - i))
    
    last_avg = annual_avg[-1]
    for year in range(len(annual_avg)):
        scale0 = last_avg / annual_avg[max(0, year - 1)]
        scale1 = last_avg / annual_avg[year]
        scale2 = last_avg / annual_avg[min(year + 1, len(annual_avg) - 1)]
        i0 = 8760 * year
        i1 = min(i + 8760, len(values))
        for i in range(i0, i1):
            if i < 4380:
                f = (i - i0) / 4380.0 + 0.5
                scale = (1 - f) * scale0 + f * scale1
            else:
                f = (i - i0 - 4380) / 4380
                scale = (1 - f) * scale1 + f * scale2
            profile[i + 1][1] = int(round(values[i] * scale))


demand = [['datehour' , 'demand (MWh)']]
with open(DEMAND_FILE) as csvfile:
    r = csv.reader(csvfile)
    next(r)  # discard header row
    for row in r:
        demand.append([NormalizeDateHour(row[0], IntQuantity(row[1])), round(FloatQuantity(row[3]))])
NormalizeDemandProfile(demand)

solar = [['datehour', 'solar (capacity = 1000)']]
with open(SOLAR_FILE) as csvfile:
    r = csv.reader(csvfile)
    next(r)  # discard header row
    #for i in range(10):
    #row = next(r)
    for row in r:
        solar.append([NormalizeDateHour(row[1], IntQuantity(row[2])), FloatQuantity(row[3])])
NormalizeGenerationProfile(solar, 0.145)

wind = [['datehour', 'wind (capacity = 1000)']]
with open(WIND_FILE) as csvfile:
    r = csv.reader(csvfile)
    next(r)  # discard header row
    #for i in range(10):
    #row = next(r)
    for row in r:
        wind.append([NormalizeDateHour(row[1], IntQuantity(row[2])), FloatQuantity(row[3])])
NormalizeGenerationProfile(wind, 0.35)

series = MergeSeries(demand, solar, wind)

# drop 2011-2012; the PV numbers are squirrelly.
first_2013 = [i for i, e in enumerate(series) if e[0] == '2013010101'][0]
series = series[0:1] + series[first_2013:]

with open(OUTPUT_FILE, 'w+') as outfile:
    w = csv.writer(outfile)
    for row in series:
        w.writerow(row)
