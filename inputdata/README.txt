ISO-NE data for 2011-2018 downloaded from:

  https://www.iso-ne.com/isoexpress/web/reports/load-and-demand/-/tree/zone-info
  https://www.iso-ne.com/isoexpress/web/reports/operations/-/tree/daily-gen-fuel-type

I downloaded the demand, solar and wind hourly profiles for each year,
loaded them into a spreadsheet, exported as CSV, and concatenated in a
text editor to make the files:

  iso-ne-hourly-demand-2011-2018.csv
  iso-ne-hourly-solar-2011-2018.csv
  iso-ne-hourly-wind-2011-2018.csv

Data was then normalized and combined using the script prepare.py
producing the combined file iso-ne-demand-solar-wind-2011-2018.csv
which is loaded by the gridx2020 tool.
