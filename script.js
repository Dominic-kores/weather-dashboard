


// ============================================================
// STEP 1: API CONFIGURATION AND CONSTANTS
// ============================================================

// Replace this placeholder with your OpenWeatherMap API key.
// NOTE: Frontend JavaScript exposes this key publicly.
// For a production app, use a backend API proxy.
const API_KEY = "f9a58ba5819f6bb37862aac46523c5e9";

// Base URL for OpenWeatherMap API version 2.5
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// Key for storing search history in the browser
const HISTORY_KEY = "weather-history";

// Maximum number of cities to remember
const MAX_HISTORY = 5;


// ============================================================
// STEP 2: SELECT HTML ELEMENTS USING THE DOM
// ============================================================

// Search input and button
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");

// Search history container
const searchHistoryContainer =
    document.getElementById("search-history");

// Loading indicator
const loadingEl = document.getElementById("loading");

// Error message elements
const errorMessageEl = document.getElementById("error-message");
const errorTextEl = document.getElementById("error-text");

// Main weather display container
const weatherDisplay = document.getElementById("weather-display");

// Current weather elements
const cityNameEl = document.getElementById("city-name");
const temperatureEl = document.getElementById("temperature");
const weatherIconEl = document.getElementById("weather-icon");
const descriptionEl = document.getElementById("description");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const feelsLikeEl = document.getElementById("feels-like");

// Five-day forecast container
const forecastCardsEl = document.getElementById("forecast-cards");


// ============================================================
// STEP 3: UI STATE MANAGEMENT
// ============================================================

// Show loading indicator while fetching weather information
function showLoading() {

    // Display loading message
    loadingEl.classList.remove("hidden");

    // Hide previous weather information
    weatherDisplay.classList.add("hidden");

    // Hide previous error messages
    errorMessageEl.classList.add("hidden");
}


// Hide loading indicator
function hideLoading() {

    loadingEl.classList.add("hidden");
}


// Display an error message to the user
function showError(message) {

    // Set error text
    errorTextEl.textContent = message;

    // Display error container
    errorMessageEl.classList.remove("hidden");

    // Hide previous weather results
    weatherDisplay.classList.add("hidden");
}


// Display successful weather results
function showWeather() {

    // Show weather information
    weatherDisplay.classList.remove("hidden");

    // Hide error message
    errorMessageEl.classList.add("hidden");
}


// ============================================================
// STEP 4: VALIDATE API RESPONSES
// ============================================================

// Fetch does not automatically throw for HTTP errors
// such as 401, 404 or 429.
//
// This function checks the status and throws an error
// when the API request was unsuccessful.

function checkResponse(response) {

    // Return if the HTTP request was successful
    if (response.ok) {
        return;
    }

    // City not found
    if (response.status === 404) {
        throw new Error("City not found");
    }

    // Invalid or inactive API key
    if (response.status === 401) {
        throw new Error("Invalid API key");
    }

    // Too many requests
    if (response.status === 429) {
        throw new Error("Rate limit exceeded");
    }

    // Other server or API errors
    throw new Error("API error");
}


// ============================================================
// STEP 5: MAIN WEATHER SEARCH FUNCTION
// ============================================================

// Async/await allows us to handle API requests cleanly.
//
// This function:
// 1. Validates the city
// 2. Shows loading
// 3. Requests current weather
// 4. Requests the forecast
// 5. Updates the UI
// 6. Saves the search history
// 7. Handles errors
// 8. Restores the search button

async function searchWeather(city) {

    // Remove extra spaces
    city = city.trim();

    // Prevent an empty search
    if (!city) {

        showError("Please enter a city name.");

        return;
    }

    // Show loading and hide previous results
    showLoading();

    // Disable the button while the request is running
    searchBtn.disabled = true;

    try {

        // ----------------------------------------------------
        // PART A: FETCH CURRENT WEATHER
        // ----------------------------------------------------

        // encodeURIComponent safely handles city names
        // containing spaces or special characters.

        const currentUrl =
            `${BASE_URL}/weather?q=${encodeURIComponent(city)}` +
            `&appid=${encodeURIComponent(API_KEY)}` +
            `&units=metric`;

        // Send HTTP GET request
        const currentResponse = await fetch(currentUrl);

        // Verify successful HTTP status
        checkResponse(currentResponse);

        // Convert JSON response into a JavaScript object
        const currentData = await currentResponse.json();


        // ----------------------------------------------------
        // PART B: FETCH FIVE-DAY FORECAST
        // ----------------------------------------------------

        // Extract coordinates from current weather results.
        // This ensures both requests use the same location.

        const { lat, lon } = currentData.coord;

        const forecastUrl =
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}` +
            `&appid=${encodeURIComponent(API_KEY)}` +
            `&units=metric`;

        // Fetch forecast
        const forecastResponse = await fetch(forecastUrl);

        // Validate response
        checkResponse(forecastResponse);

        // Convert forecast response into JavaScript object
        const forecastData = await forecastResponse.json();


        // ----------------------------------------------------
        // PART C: DISPLAY WEATHER INFORMATION
        // ----------------------------------------------------

        // Update current weather section
        displayCurrentWeather(currentData);

        // Generate forecast cards
        displayForecast(forecastData);

        // Show results after both requests succeed
        showWeather();


        // ----------------------------------------------------
        // PART D: UPDATE SEARCH HISTORY
        // ----------------------------------------------------

        // Save the recognized city name
        saveToHistory(currentData.name);

        // Update the input field
        cityInput.value = currentData.name;


    } catch (error) {

        // Log technical details for debugging
        console.error("Weather search failed:", error);

        // Display a user-friendly error
        handleWeatherError(error);

    } finally {

        // Always remove loading indicator
        hideLoading();

        // Always re-enable search button
        searchBtn.disabled = false;
    }
}


// ============================================================
// STEP 6: DISPLAY CURRENT WEATHER
// ============================================================

// Extract relevant weather data using object destructuring
// and display it in the corresponding HTML elements.

function displayCurrentWeather(data) {

    // Extract city and country information
    const { name, sys } = data;

    // Extract temperature, feels-like temperature and humidity
    const {
        temp,
        feels_like,
        humidity
    } = data.main;

    // Extract weather condition and icon
    const {
        description,
        icon
    } = data.weather[0];

    // Extract wind speed
    const { speed } = data.wind;


    // --------------------------------------------------------
    // UPDATE CITY NAME
    // --------------------------------------------------------

    cityNameEl.textContent = `${name}, ${sys.country}`;


    // --------------------------------------------------------
    // UPDATE TEMPERATURE
    // --------------------------------------------------------

    // Math.round converts decimals to whole numbers
    temperatureEl.textContent = `${Math.round(temp)}°C`;


    // --------------------------------------------------------
    // UPDATE WEATHER DESCRIPTION
    // --------------------------------------------------------

    descriptionEl.textContent = description;


    // --------------------------------------------------------
    // UPDATE WEATHER ICON
    // --------------------------------------------------------

    // OpenWeatherMap provides an icon code.
    // We insert it into the image URL.

    weatherIconEl.src =
        `https://openweathermap.org/img/wn/${icon}@2x.png`;

    weatherIconEl.alt = description;


    // --------------------------------------------------------
    // UPDATE HUMIDITY
    // --------------------------------------------------------

    humidityEl.textContent = `${humidity}%`;


    // --------------------------------------------------------
    // UPDATE WIND SPEED
    // --------------------------------------------------------

    // Metric wind speed is returned in metres per second
    windEl.textContent = `${speed} m/s`;


    // --------------------------------------------------------
    // UPDATE FEELS-LIKE TEMPERATURE
    // --------------------------------------------------------

    feelsLikeEl.textContent =
        `${Math.round(feels_like)}°C`;
}


// ============================================================
// STEP 7: FILTER DAILY FORECAST DATA
// ============================================================

// The forecast endpoint returns approximately 40 entries,
// each representing a 3-hour forecast.
//
// We group these entries by date in the searched city's
// timezone and summarize each available future day.
//
// For each date:
// - Find the highest forecast temperature
// - Find the lowest forecast temperature
// - Pick the weather icon closest to midday
//
// Note: The forecast API covers approximately 5 days from
// now. Depending on time of day, there may be fewer than
// five complete future calendar days available.

function filterDailyForecast(list, timezoneOffset = 0) {

    // Object to group forecasts by local date
    const days = {};

    // Get today's date in the searched city's timezone
    const cityNow = new Date(
        Date.now() + timezoneOffset * 1000
    );

    const todayKey = cityNow.toISOString().slice(0, 10);


    // Loop through every 3-hour forecast
    list.forEach(function(item) {

        // Convert UNIX timestamp to city-local time
        const localDate = new Date(
            (item.dt + timezoneOffset) * 1000
        );

        // Create date key: YYYY-MM-DD
        const dateKey = localDate.toISOString().slice(0, 10);

        // Skip today's predictions
        if (dateKey <= todayKey) {
            return;
        }

        // Find how close the forecast is to midday
        const hour = localDate.getUTCHours();

        const distanceFromNoon = Math.abs(hour - 12);


        // ----------------------------------------------------
        // CREATE A NEW DAILY GROUP
        // ----------------------------------------------------

        if (!days[dateKey]) {

            days[dateKey] = {

                date: dateKey,

                icon: item.weather[0].icon,

                description: item.weather[0].description,

                tempHigh: item.main.temp,

                tempLow: item.main.temp,

                closestToNoon: distanceFromNoon
            };

        } else {

            // ------------------------------------------------
            // UPDATE EXISTING DAILY GROUP
            // ------------------------------------------------

            const day = days[dateKey];

            // Highest forecast temperature
            day.tempHigh = Math.max(
                day.tempHigh,
                item.main.temp
            );

            // Lowest forecast temperature
            day.tempLow = Math.min(
                day.tempLow,
                item.main.temp
            );

            // Choose icon closest to midday
            if (distanceFromNoon < day.closestToNoon) {

                day.closestToNoon = distanceFromNoon;

                day.icon = item.weather[0].icon;

                day.description = item.weather[0].description;
            }
        }
    });


    // Convert the grouped object into an array
    const dailyForecast = Object.values(days);

    // Sort dates in chronological order
    dailyForecast.sort(function(a, b) {

        return a.date.localeCompare(b.date);
    });

    // Return a maximum of five future dates
    return dailyForecast.slice(0, 5);
}


// ============================================================
// STEP 8: DISPLAY THE FIVE-DAY FORECAST
// ============================================================

// This function dynamically creates a forecast card
// for every available day.

function displayForecast(data) {

    // Clear forecast cards from previous searches
    forecastCardsEl.innerHTML = "";

    // Group three-hour forecasts into daily summaries
    const dailyData = filterDailyForecast(
        data.list,
        data.city.timezone
    );


    // Loop through each forecast day
    dailyData.forEach(function(day) {

        // ----------------------------------------------------
        // GET DAY NAME
        // ----------------------------------------------------

        const date = new Date(`${day.date}T12:00:00Z`);

        const dayName = date.toLocaleDateString("en-US", {

            weekday: "short",

            timeZone: "UTC"
        });


        // ----------------------------------------------------
        // GET TEMPERATURES
        // ----------------------------------------------------

        const tempHigh = Math.round(day.tempHigh);

        const tempLow = Math.round(day.tempLow);


        // ----------------------------------------------------
        // CREATE FORECAST CARD
        // ----------------------------------------------------

        const card = document.createElement("div");

        card.className = "forecast-card";


        // ----------------------------------------------------
        // CREATE DAY LABEL
        // ----------------------------------------------------

        const dayEl = document.createElement("div");

        dayEl.className = "day";

        dayEl.textContent = dayName;


        // ----------------------------------------------------
        // CREATE WEATHER ICON
        // ----------------------------------------------------

        const imageEl = document.createElement("img");

        imageEl.src =
            `https://openweathermap.org/img/wn/${day.icon}@2x.png`;

        imageEl.alt = day.description;


        // ----------------------------------------------------
        // CREATE HIGH TEMPERATURE
        // ----------------------------------------------------

        const highEl = document.createElement("div");

        highEl.className = "temp-high";

        highEl.textContent = `${tempHigh}°C`;


        // ----------------------------------------------------
        // CREATE LOW TEMPERATURE
        // ----------------------------------------------------

        const lowEl = document.createElement("div");

        lowEl.className = "temp-low";

        lowEl.textContent = `${tempLow}°C`;


        // ----------------------------------------------------
        // APPEND ELEMENTS TO FORECAST CARD
        // ----------------------------------------------------

        card.appendChild(dayEl);

        card.appendChild(imageEl);

        card.appendChild(highEl);

        card.appendChild(lowEl);


        // Add completed card to the forecast container
        forecastCardsEl.appendChild(card);
    });
}


// ============================================================
// STEP 9: SEARCH HISTORY USING LOCAL STORAGE
// ============================================================

// localStorage stores information in the user's browser.
//
// Search history will remain after refreshing the page,
// unless the browser's stored data is cleared.


// ------------------------------------------------------------
// GET SAVED SEARCH HISTORY
// ------------------------------------------------------------

function getSearchHistory() {

    try {

        // Retrieve saved history from localStorage
        const savedHistory = localStorage.getItem(HISTORY_KEY);

        // No existing searches
        if (!savedHistory) {
            return [];
        }

        // Convert JSON string into an array
        const history = JSON.parse(savedHistory);

        // Validate stored data
        if (!Array.isArray(history)) {
            return [];
        }

        // Return only valid city names
        return history.filter(function(city) {

            return typeof city === "string";
        });

    } catch (error) {

        // Handle invalid stored JSON or unavailable storage
        console.error("Error reading search history:", error);

        return [];
    }
}


// ------------------------------------------------------------
// SAVE A CITY TO SEARCH HISTORY
// ------------------------------------------------------------

function saveToHistory(city) {

    // Retrieve existing history
    let history = getSearchHistory();


    // --------------------------------------------------------
    // REMOVE DUPLICATES
    // --------------------------------------------------------

    // Remove matching cities regardless of capitalization
    history = history.filter(function(item) {

        return item.toLowerCase() !== city.toLowerCase();
    });


    // --------------------------------------------------------
    // ADD MOST RECENT CITY FIRST
    // --------------------------------------------------------

    history.unshift(city);


    // --------------------------------------------------------
    // KEEP ONLY FIVE CITIES
    // --------------------------------------------------------

    history = history.slice(0, MAX_HISTORY);


    // --------------------------------------------------------
    // SAVE UPDATED HISTORY
    // --------------------------------------------------------

    try {

        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(history)
        );

    } catch (error) {

        console.error("Error saving history:", error);
    }


    // Refresh search history buttons
    renderSearchHistory();
}


// ------------------------------------------------------------
// RENDER SEARCH HISTORY BUTTONS
// ------------------------------------------------------------

function renderSearchHistory() {

    // Get saved cities
    const history = getSearchHistory();

    // Clear existing buttons
    searchHistoryContainer.innerHTML = "";


    // Create one button for every saved city
    history.forEach(function(city) {

        // Create button
        const button = document.createElement("button");

        // Set button type and class
        button.type = "button";

        button.className = "history-btn";

        // Set city name
        button.textContent = city;


        // ----------------------------------------------------
        // HANDLE HISTORY BUTTON CLICK
        // ----------------------------------------------------

        button.addEventListener("click", function() {

            // Prevent overlapping searches
            if (searchBtn.disabled) {
                return;
            }

            // Update the input field
            cityInput.value = city;

            // Search the selected city
            searchWeather(city);
        });


        // Add button to history container
        searchHistoryContainer.appendChild(button);
    });
}


// ============================================================
// STEP 10: ERROR HANDLING
// ============================================================

// Display different error messages depending on what failed.

function handleWeatherError(error) {

    // --------------------------------------------------------
    // INVALID CITY
    // --------------------------------------------------------

    if (error.message === "City not found") {

        showError(
            "City not found. Please check the spelling and try again."
        );

    // --------------------------------------------------------
    // NETWORK ERROR
    // --------------------------------------------------------

    } else if (error instanceof TypeError) {

        showError(
            "Unable to connect. Please check your internet connection and try again."
        );

    // --------------------------------------------------------
    // INVALID API KEY
    // --------------------------------------------------------

    } else if (error.message === "Invalid API key") {

        showError(
            "Weather API authentication failed. Please check your API key."
        );

    // --------------------------------------------------------
    // API RATE LIMIT
    // --------------------------------------------------------

    } else if (error.message === "Rate limit exceeded") {

        showError(
            "Too many weather requests. Please try again later."
        );

    // --------------------------------------------------------
    // OTHER ERRORS
    // --------------------------------------------------------

    } else {

        showError(
            "Something went wrong. Please try again later."
        );
    }
}


// ============================================================
// STEP 11: SEARCH BUTTON EVENT LISTENER
// ============================================================

// Run a weather search when the Search button is clicked.

searchBtn.addEventListener("click", function() {

    // Get city name from search input
    const city = cityInput.value.trim();

    // Execute weather search
    searchWeather(city);
});


// ============================================================
// STEP 12: ENTER KEY EVENT LISTENER
// ============================================================

// Allow searching without clicking the Search button.

cityInput.addEventListener("keydown", function(event) {

    // Check if Enter key was pressed
    if (event.key === "Enter") {

        // Do nothing when another search is running
        if (searchBtn.disabled) {
            return;
        }

        // Read the input value
        const city = cityInput.value.trim();

        // Execute weather search
        searchWeather(city);
    }
});


// ============================================================
// STEP 13: INITIALIZE THE APPLICATION
// ============================================================

// Render saved city history when the page first opens.
renderSearchHistory();

// Helpful console message for debugging
console.log("Weather Dashboard initialized successfully.");
