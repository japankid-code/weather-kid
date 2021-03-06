const openweatherAPIkey = `39013a4639d8aedbe6d4da81a858d623`; // shh this is a secret

const searchHistButton = document.getElementById("old-search");
const forecastArticle = document.getElementById("forecast-article");

const searchHistList = document.getElementById("search-history");
const forecastList = document.getElementById("forecast-container");

const cityEl = document.getElementById("city-name");
const dateEl = document.getElementById("current-date");
const iconEl = document.getElementById("weather-icon");
const tempEl = document.getElementById("t");
const windEl = document.getElementById("w");
const humidityEl = document.getElementById("h");
const indexEl = document.getElementById("UV-index");

const searchButton = document.getElementById("search-button");

forecastList.innerHTML = '';

let searchHistory = JSON.parse(localStorage.getItem('searches')) || [];

let citiesArray = JSON.parse(localStorage.getItem('searches')) || [];

const dateStringer = (date) => {
    return ("0" + (date.getUTCMonth()+1)).slice(-2) + "/" + 
    ("0" + date.getUTCDate()).slice(-2) + "/" +
    ("" + date.getUTCFullYear()).slice(-2);
}

const renderBtns = (array) => {
    searchHistList.innerHTML = '';
    array.forEach((search, index) => {
        let searchItem = document.createElement("button");
        searchItem.classList = "searchItem m-2 px-2 py-1 bg-gray-400 border-gray-900 border-2 rounded-lg w-full";
        searchItem.textContent = searchHistory[index];
        searchHistList.append(searchItem);
    })
}

const searchLoad = () => {
    searchHistory =  JSON.parse(localStorage.getItem("searches"));
}

const searchSave = (search) => {
    // update the input value from the DOM
    searchHistory.push(search);
    localStorage.setItem("searches", JSON.stringify(searchHistory))
    renderBtns(searchHistory);
}

function myFunction(city) {
    let searchObject = {};
    // make sure they type somethign in
    if (city === null || city === undefined || city === '') {
        return;
    }
    fetch(// first openweather fetch for today's data.
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${openweatherAPIkey}&units=imperial`
    )
    .then((response) => response.json())
    .then((todaysData) => {
        // values get overwritten for city, date and icon
        // get the city name
        let cityName = todaysData.name;
        cityEl.innerHTML = `${cityName} | `;
        searchObject.name = cityName;
        // use the date to pull out year, month and day
        let dataTime = todaysData.dt;
        let now = new Date(dataTime * 1000);
        let dateString = dateStringer(now);
        dateEl.innerHTML = `${dateString} | `;
        searchObject.date = dateString;
        // get the icon code to pass in to the icon img src
        let todayIconCode = todaysData.weather[0].icon;
        let iconUrl = `http://openweathermap.org/img/w/${todayIconCode}.png`;
        iconEl.innerHTML = `<img src='${iconUrl}' class="inline"/>`;

        // values get appended to the divs for wind, temp and hums.
        // put the temp inside a new span and append it to today's weather
        let todayTemp = todaysData.main.temp;
        tempEl.innerHTML = `${todayTemp} &deg;F`;
        // put the wind inside a new span and append it to today's weather
        let todayWind = todaysData.wind.speed;
        windEl.innerHTML = `${todayWind} MPH`
        // put the humidity inside a new span and append it to today's weather
        let todayHumidity = todaysData.main.humidity;
        humidityEl.innerHTML = `${todayHumidity}%`;
        // take care of UV index with another API call
        // grab the latitude and longitude from today's data,
        let lat = todaysData.coord.lat;
        let lon = todaysData.coord.lon;
        searchObject.lat = lat;
        searchObject.lon = lon;
        forecaster(searchObject);
        UVcolorizer(searchObject);
        })
        
}

const forecaster = (object) => {
    let lat = object.lat;
    let lon = object.lon;
    let date = object.date;
    let forecastUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${openweatherAPIkey}&units=imperial&exclude={current,minutely,hourly,alerts}`;
    fetch(forecastUrl)
        .then(response => response.json())
        .then(forecastData => {
            forecastList.innerHTML = '';
            for (let i = 1; i <6; i++) {
                // create the article element holding 1 day's forecast
                let forecastArticle = document.createElement("article");
                forecastArticle.classList = 'm-1 p-1 col-span-1 flex flex-col justify-center bg-purple-600 rounded ';
                forecastArticle.setAttribute('src', `forecast-article-${i}`);
                // grab value for the date and run it thru the stringer
                let fDataTime = forecastData.daily[`${i}`].dt;
                let now = new Date(fDataTime * 1000);
                let fString = dateStringer(now);
                let dateChild = document.createElement(`span`);
                dateChild.classList = 'block';
                dateChild.innerHTML = `${fString}`;
                forecastArticle.appendChild(dateChild);
                // grab the icon code and append it using the APIs icon URL
                let fIcon = forecastData.daily[`${i}`].weather[0].icon;
                let iconUrl = `http://openweathermap.org/img/w/${fIcon}.png`;

                let iconChild = document.createElement("img");
                iconChild.classList = '';
                iconChild.src = iconUrl;
                forecastArticle.appendChild(iconChild);
                // add the temp, wind, humidity in using innerHTML to add  elements
                let fTemp = forecastData.daily[`${i}`].temp.day.toString().slice(0, 2);
                let fWind = Math.round(forecastData.daily[`${i}`].wind_speed);
                let fHums = forecastData.daily[`${i}`].humidity.toString();
                iconChild.insertAdjacentHTML('afterend', 
                    `<div class='flex justify-between text-xs'>
                        <p>h: </p>
                        <p>${fHums}%</p>
                    </div>`
                );
                iconChild.insertAdjacentHTML('afterend', 
                    `<div class='flex justify-between text-xs'>
                        <p>w: </p>
                        <p>${fWind} MPH</p>
                    </div>`
                );
                iconChild.insertAdjacentHTML('afterend', 
                    `<div class='flex justify-between text-xs'>
                        <p>t: </p>
                        <p>${fTemp}&deg;F</p>
                    </div>`
                );
                // add it all to the forecast-container
                if (forecastList.children.length < 5) {
                    forecastList.appendChild(forecastArticle);
                } else if (forecastList.children.length > 5) {
                    forecastList.innerHTML = '';
                    forecastList.appendChild(forecastArticle);
                }
            }
        })
}

// pass to a consecutive fetch grabbing the UV index for the day
const UVcolorizer = (object) => {
    let lat = object.lat;
    let lon = object.lon;
    let UVindexUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${openweatherAPIkey}`;        
    fetch(UVindexUrl)
        .then((response) => response.json())
        .then((UVDataObj) => {
            let UVI = UVDataObj.value;
            let indexValue = document.createElement("span");
            indexValue.setAttribute('id', 'index-value');
            indexValue.classList = 'bg-gray-400 rounded p-1';
            if (UVI <= 5) { // 0 to 5 is yellow
                indexValue.classList.add('bg-yellow-400');
            } else if (UVI <= 7) { // 6-7 is orange
                indexValue.classList.add('bg-orange-400');
            } else if (UVI <= 10.5) { // 8-10 red
                indexValue.classList.add('bg-red-400');
            } else if (UVI > 10.5){ // 11+ is extreme purple
                indexValue.classList.add('bg-purple-400');
            }
            
            indexValue.innerHTML = `${UVI}`;
            if (indexEl.childElementCount <= 1) {
                indexEl.appendChild(indexValue);
            } else if (indexEl.children.length >= 2) {
                indexEl.removeChild(indexEl.children[1]);
                indexEl.appendChild(indexValue);
            }
        })
        .catch((error) => console.log(error))
}


renderBtns(searchHistory);

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('searchItem')) {
        let city = e.target.textContent;
        console.log(city)
        myFunction(city);
    } else if (e.target.id == 'search-button') {
        let city = document.getElementById('search-input').value;
        if (city == null || city == undefined || city == '') {
            return;
        }
        searchSave(city);
        myFunction(city);
    }
 });