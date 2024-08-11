rm -f mpcorb_extended.json.gz
wget https://minorplanetcenter.net/Extended_Files/mpcorb_extended.json.gz
rm -f output_part*.csv
rm -f mpcorb_extended.json
gunzip mpcorb_extended.json.gz
./converter-mpcorb.py mpcorb_extended.json output.csv --chunk 10000

./create-sorcha-input.py L01
rm -f eph.*.csv
ls output_part*.csv | parallel -j 8 'sorcha run -c eph_footprint_new.ini -p ssp>

mpsky build L01 eph.output_part*.csv --output today.mpsky.bin -j 8

mpsky serve today.mpsky.bin --verbose
