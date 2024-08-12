console.log("Hellooo woorld!")
const form = document.getElementById('ephemeridesForm');
const table = document.getElementById('ephemeridesTable');
const downloadButton = document.getElementById('downloadCsv');
const toggleFormatButton = document.getElementById('convertUnitsButton');
const runtimeDisplay = document.getElementById('runtime');



let useSexagesimal = false;
let originalData = [];

function toLocalISOString(date) {
    const UTCDate = new Date(date); //offset in milliseconds. Credit https://stackoverflow.com/questions/10830357/javascript-toisostring-ignores-timezone-offset

    // Optionally remove second/millisecond if needed

    UTCDate.setMilliseconds(null);
    return UTCDate.toISOString().slice(0, -1);
}
    window.addEventListener("load", () => {
    document.getElementById("datetime").value = toLocalISOString(new Date());
});

form.addEventListener('submit', function(event) {
    event.preventDefault();
    const aladinMap = document.getElementById("aladin-lite-div");
    const datetime = document.getElementById('datetime').value;
    const ra = parseFloat(document.getElementById("ra").value);
    const dec = parseFloat(document.getElementById('dec').value);
    const radius = parseFloat(document.getElementById("radius").value);
    // const radius = Math.sqrt(parseFloat(document.getElementById('side-a').value)**2 + parseFloat(document.getElementById("side-b")**2))/2;

    const mjd = calculateMJD(datetime);

    const apiUrl = `https://mpsky.org/api/v1/ephemerides/?t=${mjd}&ra=${ra}&dec=${dec}&radius=${radius}`;

    const startTime = performance.now(); // Start time measurement

    

    data = fetchEphemerides(apiUrl);
    aladin.setFov(radius*2.5);
    aladin.gotoRaDec(ra, dec);

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Clear previous table data
            table.innerHTML = "";

            if (data.length === 0) {
                const noDataMessage = document.createElement('p');
                noDataMessage.textContent = "No data available for the given parameters.";
                table.appendChild(noDataMessage);
                downloadButton.style.display = "none"; // Hide download button
                return;
            }

            originalData = JSON.parse(JSON.stringify(data)); // Store original data

            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');

            // Create table header
            const headers = Object.keys(data[0]);
            const headerRow = document.createElement('tr');
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Create table rows
            data.forEach(item => {
                const row = document.createElement('tr');
                headers.forEach(header => {
                    const cell = document.createElement('td');
                    if (useSexagesimal && (header === 'ra' || header === 'dec')) {
                        cell.textContent = convertToSexagesimal(item[header], header === 'ra');
                    } else {
                        cell.textContent = item[header];
                    }
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            // Calculate and display runtime
            const endTime = performance.now(); // End time measurement
            const runtime = endTime - startTime;
            runtimeDisplay.textContent = `Fetch runtime: ${runtime.toFixed(2)} ms`;

            // Show the download button
            downloadButton.style.display = "inline-block";

            // Add event listener to download button
            downloadButton.onclick = function() {
                const csvData = convertToCSV(originalData);
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'data.csv');
                link.click();
            };
        })
        .catch(error => {
            console.error('Error:', error);
            table.innerHTML = "<p>Error fetching data. Please try again.</p>";
            downloadButton.style.display = "none"; // Hide download button
        });
});

async function fetchEphemerides(url) {
    const startTime = performance.now();
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        generateAddAsteroids(data);
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        // alert('Failed to fetch data. Please check the console for more details.');
    } finally {
        const endTime = performance.now();
        const runtime = endTime - startTime;
        document.getElementById('runtime').textContent = `Fetch runtime: ${runtime.toFixed(2)} ms`;
    };
};

toggleFormatButton.addEventListener('click', function() {
    useSexagesimal = !useSexagesimal;
    // Re-render table with new format
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent);
    const raIndex = headers.indexOf('ra');
    const decIndex = headers.indexOf('dec');

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        if (raIndex !== -1) {
            const raValue = originalData[rowIndex].ra;
            cells[raIndex].textContent = useSexagesimal ? convertToSexagesimal(raValue, true) : raValue;
        }
        if (decIndex !== -1) {
            const decValue = originalData[rowIndex].dec;
            cells[decIndex].textContent = useSexagesimal ? convertToSexagesimal(decValue, false) : decValue;
        }
    });
});


function calculateMJD(datetime) {
    const date = new Date(datetime);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();

    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;

    const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    const jdFraction = (hour - 12) / 24 + minute / 1440 + second / 86400;

    return jd + jdFraction - 2400000.5;
}

function convertToCSV(data) {
    const headers = Object.keys(data[0]);
    const rows = data.map(item => headers.map(header => item[header]));
    const csvArray = [headers, ...rows];
    return csvArray.map(row => row.join(',')).join('\n');
}




function convertToSexagesimal(decimalDegrees, isRA) {
    if (isRA) {
        decimalDegrees /= 15;
    }
    const totalSeconds = Math.abs(decimalDegrees * 3600);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    if (isRA) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else {
        const sign = Math.sign(decimalDegrees) >= 0 ? '+' : '-';
        return `${sign}${hours}° ${minutes}' ${seconds}"`;
    };
};
function toggleTableVisibility() {
    var table = document.getElementById("ephemeridesTable");
    if (table.style.display === "none") {
        table.style.display = "table"
    };
};

function calculateRadius(ra, dec) {
    // Add your radius calculation logic here based on ra and dec values, for example:
    const radius = Math.sqrt(ra * ra + dec * dec);
    return radius;
}
function generateAddAsteroids(data) {

    var cat = A.catalog({color: 'red', onClick: 'showTable', labelColumn:"name", displayLabel: true, labelColor: "#FFF", labelFont: "12px sans-serif"});

    originalSources = data.map(item => {
        return A.source(Number(item["ra"]), Number(item["dec"]), {name: item["name"]});
    });
    cat.addSources(originalSources);
    aladin.addCatalog(cat);

};


const decInput = document.getElementById('dec');

decInput.addEventListener('input', function() {
    let value = parseFloat(decInput.value);
    if (value < -90) {
        decInput.value = -90;
    } else if (value > 90) {
        decInput.value = 90;
    }
});
const raInput = document.getElementById('ra');

raInput.addEventListener('input', function() {
    let value = parseFloat(raInput.value);
    if (value < 0) {
        raInput.value = 0;
    } else if (value > 360) {
        raInput.value = 360;
    }
});
const radiusInput = document.getElementById('radius');

radiusInput.addEventListener('input', function() {
    let value = parseFloat(radiusInput.value);
    if (value < 0) {
        radiusInput.value = 0;
    } else if (value > 6) {
        radiusInput.value = 6;
    }
});

function getOption() {
    var latLong = document.getElementById("latLong")
    selectElement = document.querySelector('#mount');
    output = selectElement.value;
    console.log(output);
    // document.querySelector('.output').textContent = output;
    if (output === "Altaz") {
        latLong.style.display = "flex";
    }
    if (output === "Equatorial") {
        latLong.style.display = "none";
    }
};

function rotationCalculations(date) {
    const ra = parseFloat((document.getElementById("ra").value)/360*2*Math.PI);
    const dec = parseFloat((document.getElementById("dec").value)/360*2*Math.PI);
    const long = parseFloat((document.getElementById("long").value)/360*2*Math.PI);
    const lat = parseFloat((document.getElementById("lat").value)/360*2*Math.PI);


    var date = new Date().getUTCHours();
    var hours = new Date(document.getElementById('datetime').value).getHours();
    var minutes = new Date(document.getElementById('datetime').value).getMinutes();
    var seconds = new Date(document.getElementById('datetime').value).getSeconds();
    var degreeTime = parseFloat((hours + minutes/60 + seconds/3600)*2*Math.PI);
    var HA = parseFloat(degreeTime + long - ra);

    console.log(degreeTime, HA);

    var t1 = Math.round(HA);
    var t2 = (hours+minutes/60)*(15/360)*2*Math.PI;

    var rotation = 0;
    var speed = 0;

    if (t1>t2) {
        for(let i = 0; i >= (t2-t1)*100; i--) {
            var integratedDegreeTime = parseFloat((hours + minutes/60 + seconds/3600)*2*Math.PI+i/100);
            var HAiDT = parseFloat(integratedDegreeTime + long - ra);

            var alt = parseFloat(Math.asin(Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.cos(HAiDT)));
            var az = parseFloat(Math.acos((Math.sin(dec)))-(Math.sin(alt)*Math.sin(lat)))/(Math.cos(alt)*Math.cos(lat));
        
            speed = (15.0416 * (Math.cos(az))/Math.cos(alt));
            rotation += speed*(i/100);
            if (i % 5 === 0) {
                console.log(i, "Ha", HA, "iDT", integratedDegreeTime, "HAiDT", HAiDT, "alt-az", alt, az, "speed", speed, "rotation", rotation);
            }
        }
    }
    
};

// function localDate(date) {
//     var date = new Date();
//     var local = date.getTime() + (date.getTimezoneOffset()*60000)

//     console.log(local, date);
// };
