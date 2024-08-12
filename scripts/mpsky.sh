 #!/bin/bash

# Change to the desired directory
cd ~/one-night || exit

# Remove old files
rm -f mpcorb_extended.json.gz
rm -f output_part*.csv
rm -f mpcorb_extended.json

# Download and process the new file
wget https://minorplanetcenter.net/Extended_Files/mpcorb_extended.json.gz
gunzip mpcorb_extended.json.gz
./converter-mpcorb.py mpcorb_extended.json output.csv --chunk 10000

# Create input for Sorcha
./create-sorcha-input.py L01

# Remove old ephemerides files
rm -f eph.*.csv

# Process files in parallel
# ls output_part*.csv | parallel -j 8 'sorcha run -c eph_footprint_new.ini -p ssp>'
ls output_part*.csv | parallel -j 8 'sorcha run -c eph_footprint_new.ini -p sspp_testset_colours.csv -ob {} -pd new.db -o ./ -t foo -ew eph.{.}.csv'


# Build the MPSKY binary
mpsky build L01 eph.output_part*.csv --output today.mpsky.bin -j 8

# Kill the old screen session if it exists
if screen -list | grep -q "mpsky-server"; then
    screen -S mpsky-server -X quit
fi

# Start mpsky server in a new screen session
screen -dmS mpsky-server mpsky serve today.mpsky.bin --verbose


