import './App.css';
import { useEffect, useState } from 'react';

export default function App() {
	const [location, setLocation] = useState('');
	const [isLoading, setLoading] = useState(false);
	const [displayLocation, setDisplayLocation] = useState('');
	const [weather, setWeather] = useState({});

	function convertToFlag(countryCode) {
		const codePoints = countryCode
			.toUpperCase()
			.split('')
			.map((char) => 127397 + char.charCodeAt());
		return String.fromCodePoint(...codePoints);
	}

	useEffect(
		function () {
			async function fetchWeather() {
				if (location.length < 2) return setWeather({});
				try {
					setLoading(true);
					const geoRes = await fetch(
						`https://geocoding-api.open-meteo.com/v1/search?name=${location}`,
					);
					const geoData = await geoRes.json();

					if (!geoData.results) throw new Error('Location not found');

					const { latitude, longitude, timezone, name, country_code } =
						geoData.results.at(0);
					setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

					// 2) Getting actual weather
					const weatherRes = await fetch(
						`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`,
					);
					const weatherData = await weatherRes.json();
					setWeather(weatherData.daily);
					localStorage.setItem('location', location);
				} catch (err) {
					alert(err);
				} finally {
					setLoading(false);
				}
			}

			fetchWeather();
		},
		[location],
	);

	useEffect(function () {
		setLocation(localStorage.getItem('location') || '');
	}, []);

	return (
		<div className="app">
			<h1>Funcational Weather App</h1>
			<Input location={location} onChangeLocation={setLocation} />
			{isLoading && <p className="loader">Loading...</p>}
			{weather.weathercode && (
				<Weather
					weather={weather}
					location={location}
					displayLocation={displayLocation}
				/>
			)}
		</div>
	);
}

function Day({ date, max, min, code, isToday }) {
	function getWeatherIcon(wmoCode) {
		const icons = new Map([
			[[0], '☀️'],
			[[1], '🌤️'],
			[[2], '⛅'],
			[[3], '☁️'],
			[[45, 48], '🌫️'],
			[[51, 56, 61, 66, 80], '🌦️'],
			[[53, 55, 63, 65, 57, 67, 81, 82], '🌧️'],
			[[71, 73, 75, 77, 85, 86], '🌨️'],
			[[95], '🌩️'],
			[[96, 99], '⛈️'],
		]);
		const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
		if (!arr) return 'NOT FOUND';
		return icons.get(arr);
	}

	function formatDay(dateStr) {
		return new Intl.DateTimeFormat('en', {
			weekday: 'short',
		}).format(new Date(dateStr));
	}

	return (
		<li className="day">
			<span>{getWeatherIcon(code)}</span>
			<p>{isToday ? 'Today' : formatDay(date)}</p>
			<p>
				{Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
			</p>
		</li>
	);
}

function Input({ location, onChangeLocation }) {
	return (
		<div>
			<input
				type="text"
				placeholder="Search for location..."
				value={location}
				onChange={(e) => onChangeLocation(e.target.value)}
			/>
		</div>
	);
}

function Weather({ weather, location, displayLocation }) {
	const {
		temperature_2m_max: max,
		temperature_2m_min: min,
		time: dates,
		weathercode: codes,
	} = weather;
	//   console.log(dates);
	return (
		<div>
			<h2>Weather {displayLocation}</h2>
			<ul className="weather">
				{dates.map((date, i) => (
					<Day
						date={date}
						max={max.at(i)}
						min={min.at(i)}
						code={codes.at(i)}
						key={date}
						isToday={i === 0}
					/>
				))}
			</ul>
		</div>
	);
}
