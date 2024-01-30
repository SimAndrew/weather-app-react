import './App.css';
import React from 'react';

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

function convertToFlag(countryCode) {
	const codePoints = countryCode
		.toUpperCase()
		.split('')
		.map((char) => 127397 + char.charCodeAt());
	return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
	return new Intl.DateTimeFormat('en', {
		weekday: 'short',
	}).format(new Date(dateStr));
}

class App extends React.Component {
	state = {
		location: '',
		isLoading: false,
		displayLocation: '',
		weather: {},
	};

	fetchWeather = async () => {
		try {
			this.setState({ isLoading: true });

			const geoRes = await fetch(
				`https://geocoding-api.open-meteo.com/v1/search?name=${this.state.location}`,
			);
			const geoData = await geoRes.json();

			console.log(geoData);

			if (!geoData.results) throw new Error('Location not found');

			const { latitude, longitude, timezone, name, country_code } =
				geoData.results.at(0);

			this.setState({
				displayLocation: `${name} ${convertToFlag(country_code)}`,
			});

			const weatherRes = await fetch(
				`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`,
			);
			const weatherData = await weatherRes.json();

			this.setState({ weather: weatherData.daily });
		} catch (err) {
			alert(err);

			console.err(err);
		} finally {
			this.setState({ isLoading: false });
		}
	};

	setLocation = (e) => this.setState({ location: e.target.value });

	render() {
		return (
			<div className="app">
				<h1>Weather App</h1>
				<Input
					location={this.state.location}
					onChangeLocation={this.setLocation}
				/>
				<button className="button" onClick={this.fetchWeather}>
					Get weather
				</button>

				{this.setState.isLoading && <p className="loader">Loading...</p>}

				{this.state.weather.weathercode && (
					<Weather
						weather={this.state.weather}
						location={this.state.displayLocation}
					/>
				)}
			</div>
		);
	}
}

export default App;

class Input extends React.Component {
	render() {
		return (
			<input
				type="text"
				placeholder="Search for location..."
				value={this.props.location}
				onChange={this.props.onChangeLocation}
			/>
		);
	}
}

class Weather extends React.Component {
	render() {
		const {
			temperature_2m_max: maxTemp,
			temperature_2m_min: minTemp,
			time: dates,
			weathercode: codes,
		} = this.props.weather;

		return (
			<div>
				<h2>Weather {this.props.location}</h2>
				<ul className="weather">
					{dates.map((date, i) => (
						<Day
							date={date}
							maxTemp={maxTemp.at(i)}
							minTemp={minTemp.at(i)}
							code={codes.at(i)}
							key={date}
							isToday={i === 0}
						/>
					))}
				</ul>
			</div>
		);
	}
}

class Day extends React.Component {
	render() {
		const { date, maxTemp, minTemp, code, isToday } = this.props;

		return (
			<li className="day">
				<span>{getWeatherIcon(code)}</span>
				<p>{isToday ? 'Today' : formatDay(date)}</p>
				<p>
					{Math.floor(minTemp)}&deg; &mdash;{' '}
					<strong>{Math.ceil(maxTemp)}&deg;</strong>
				</p>
			</li>
		);
	}
}
