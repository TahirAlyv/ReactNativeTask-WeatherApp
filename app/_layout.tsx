import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function WeatherScreen({ navigation }: any) {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const API_KEY = "b3e766b1aeb38ba9fe30878d80790d64";

 
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Please allow location access ❌");
          await loadLastWeather();
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;
        await fetchWeatherByCoords(latitude, longitude);
      } catch (err) {
        Alert.alert("Error", "Location not available ❌");
        await loadLastWeather();
      } finally {
        setLoading(false);
      }
    })();
  }, []);
 
  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`
      );
      const data = await res.json();
      if (data.cod === 200) {
        setWeather(data);
        setCity(data.name);
        await AsyncStorage.setItem("lastWeather", JSON.stringify(data));
      } else {
        await loadLastWeather();
      }
    } catch (err) {
      await loadLastWeather();
    }
  };

 
  const fetchWeatherByCity = async () => {
    if (!city.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=en`
      );
      const data = await res.json();
      if (data.cod === 200) {
        setWeather(data);
        setCity(data.name);
        await AsyncStorage.setItem("lastWeather", JSON.stringify(data));
      } else {
        setWeather(null);
        Alert.alert("No Results", "City not found ❌");
      }
    } catch (err) {
      Alert.alert("Error", "Problem fetching data");
    } finally {
      setLoading(false);
    }
  };

 
  const loadLastWeather = async () => {
    try {
      const last = await AsyncStorage.getItem("lastWeather");
      if (last) {
        const data = JSON.parse(last);
        setWeather(data);
        setCity(data.name);
      }
    } catch (err) {
      console.log("Failed to load last weather:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌤 Weather</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter city name..."
        value={city}
        onChangeText={setCity}
      />

      <TouchableOpacity
        style={[styles.button, !city.trim() && { backgroundColor: "#ccc" }]}
        onPress={fetchWeatherByCity}
        disabled={!city.trim()}
      >
        <Text style={styles.buttonText}>Show</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}

      {weather && !loading && (
        <View style={styles.result}>
          <Text style={styles.city}>{weather.name}</Text>
          <Text style={styles.temp}>{Math.round(weather.main.temp)}°C</Text>
          <Text style={styles.desc}>{weather.weather[0].description}</Text>
          <Text>💧 Humidity: {weather.main.humidity}%</Text>
          <Text>🌡 Feels like: {Math.round(weather.main.feels_like)}°C</Text>
        </View>
      )}

      <TouchableOpacity onPress={() => navigation.navigate("HomeScreen")}>
        <Text style={styles.link}>🏠 Go back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F9FAFB" },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginVertical: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 15,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  result: { marginTop: 30, alignItems: "center" },
  city: { fontSize: 22, fontWeight: "bold" },
  temp: { fontSize: 48, fontWeight: "bold", color: "#007AFF" },
  desc: { fontSize: 18, fontStyle: "italic", marginVertical: 5 },
  link: { marginTop: 40, textAlign: "center", color: "#007AFF", fontWeight: "600" },
});
