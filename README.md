# one-night
# The process of getting data for the day

## Convert JSON to CSV
  - rm -f mpcorb_extended.json.gz
  - wget https://minorplanetcenter.net/Extended_Files/mpcorb_extended.json.gz
  - rm -f output_part*.csv
  - gunzip mpcorb_extended.json.gz
  - ./converter-mpcorb.py mpcorb_extended.json output.csv --chunk 10000
## Create sorcha input - python (json file to csv)
  - ./create-sorcha-input.py L01
  - rm -f eph.*.csv
  - ls output_part*.csv | parallel -j 8 'sorcha run -c eph_footprint_new.ini -p sspp_testset_colours.csv -ob {} -pd new.db -o ./ -t foo -ew eph.{.}.csv'
## Ran “mpsky build”
  - mpsky build L01 eph.output_part*.csv --output today.mpsky.bin -j 8
## Ran “mpsky serve”
  -mpsky serve today.mpsky.bin --verbose

# Github
  - How to create an account
  - How to make a new (public) repository
  - How to push and pull to it (add files…)
  - How to add external collaborators

  git init, git clone, git add, git commit, git pull, git push
  downloaded GitHub Desktop
