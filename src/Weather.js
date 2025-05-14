import React, { useState } from 'react';
import styles from './Weather.module.css';

function Weather() {
    const [city, setCity] = useState('');
    const [weatherData, setWeatherData] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedCoords, setCopiedCoords] = useState(null);

    const handleCityChange = (e) => {
        let value = e.target.value;

        // Удаляем лишние пробелы (заменяем множественные на один)
        value = value.replace(/\s+/g, ' ').trimStart();

        // Разрешаем только буквы и пробелы (включая кириллицу)
        if (/^[a-zA-Zа-яА-Я\s]*$/.test(value) || value === '') {
            setCity(value);
            setError('');
        }
    };

    const fetchWeather = async () => {
        const trimmedCity = city.trim();

        if (!trimmedCity) {
            setError('Введите название города');
            setWeatherData(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const apiKey = process.env.REACT_APP_API_KEY;
            const url = `https://api.openweathermap.org/data/2.5/find?q=${trimmedCity}&appid=${apiKey}&units=metric`;
            const response = await fetch(url);

            if (!response.ok) throw new Error('Город не найден');

            const data = await response.json();

            if (data.list?.length > 0) {
                const uniqueData = [];
                const coordinatesSet = new Set();

                data.list.forEach(item => {
                    const coords = `${item.coord.lat},${item.coord.lon}`;
                    if (!coordinatesSet.has(coords)) {
                        coordinatesSet.add(coords);
                        uniqueData.push(item);
                    }
                });

                setWeatherData(uniqueData);
            } else {
                throw new Error('Город не найден');
            }
        } catch (err) {
            setError(err.message === 'Город не найден'
                ? err.message
                : 'Ошибка подключения. Проверьте интернет');
            setWeatherData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchWeather();
    };

    const handleCopyCoords = (lat, lon) => {
        navigator.clipboard.writeText(`${lat}, ${lon}`);
        setCopiedCoords(`${lat}, ${lon}`);
        setTimeout(() => setCopiedCoords(null), 2000);
    };

    return (
        <div className={styles.weatherApp}>
            <header className={styles.searchHeader}>
                <div className={styles.searchWrapper}>
                    <h1 className={styles.title}>Прогноз погоды</h1>
                    <form onSubmit={handleSubmit} className={styles.searchContainer}>
                        <input
                            type="text"
                            value={city}
                            onChange={handleCityChange}
                            placeholder="Поиск города..."
                            className={styles.searchInput}
                            maxLength={60}
                            pattern="[a-zA-Zа-яА-Я\s]+"
                            title="Разрешены только буквы и пробелы"
                        />
                        <button
                            onClick={fetchWeather}
                            className={styles.searchButton}
                        >
                            {isLoading ? (
                                <span className={styles.spinner}></span>
                            ) : (
                                'Поиск'
                            )}
                        </button>

                    </form>
                    {error && <div className={styles.errorMessage}>{error}</div>}
                </div>
            </header>

            <main className={styles.mainContent}>
                {weatherData === null ? (
                    <div className={styles.initialState}>
                        Введите город для поиска прогноза погоды
                    </div>
                ) : weatherData?.length > 0 ? (
                    <div className={styles.weatherGrid}>
                        {weatherData.map((item) => (
                            <div key={`${item.id}-${item.coord.lat}`} className={styles.weatherCard}>
                                <div className={styles.cardHeader}>
                                    <h2>{item.name}, {item.sys.country}</h2>
                                    <img
                                        src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                                        alt={item.weather[0].description}
                                        className={styles.weatherIcon}
                                    />
                                </div>
                                <div className={styles.weatherDetails}>
                                    <p className={styles.temperature}>
                                        {Math.round(item.main.temp)}°C
                                    </p>
                                    <p className={styles.description}>
                                        {item.weather[0].description}
                                    </p>
                                    <div className={styles.additionalInfo}>
                                        <span>Влажность: {item.main.humidity}%</span>
                                        <span>Ветер: {item.wind.speed} м/с</span>
                                    </div>
                                    <div className={styles.coordinates}>
                                        <span>Координаты: </span>
                                        <button
                                            onClick={() => handleCopyCoords(item.coord.lat, item.coord.lon)}
                                            className={styles.coordsButton}
                                            title="Копировать координаты"
                                        >
                                            {item.coord.lat.toFixed(4)}°, {item.coord.lon.toFixed(4)}°
                                        </button>
                                        {copiedCoords === `${item.coord.lat}, ${item.coord.lon}` && (
                                            <span className={styles.copiedNotification}>Скопировано!</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !isLoading && <div className={styles.noResults}>Нет результатов для отображения</div>
                )}
            </main>
        </div>
    );
}

export default Weather;