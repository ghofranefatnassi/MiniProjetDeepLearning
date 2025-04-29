import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

const { height, width } = Dimensions.get('window');

const App = () => {
  const [result, setResult] = useState('');
  const [label, setLabel] = useState('');
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getPrediction = async (uri) => {
    setIsLoading(true);
    setLabel('Predicting...');
    setResult('');
    setError('');
    
    try {
      // Create FormData payload
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'image.jpg',
        type: 'image/jpeg',
      });

      const apiUrl = process.env.URL || "https://us-central1-isentropic-tape-458318-t1.cloudfunctions.net/predict";;
      
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
      });

      if (response?.data) {
        const { class: predictedClass, confidence } = response.data;
        
        if (predictedClass && confidence !== undefined) {
          setLabel(predictedClass);
          setResult((confidence * 100).toFixed(2)); // Convert to percentage
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error('No data received from server');
      }
    } catch (error) {
      console.error('Prediction error:', error);
      setError(error.message || 'Failed to make prediction');
      setLabel('Prediction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async (useCamera = false) => {
    try {
      let result;
      
      // Request permissions
      const permissionType = useCamera 
        ? ImagePicker.requestCameraPermissionsAsync()
        : ImagePicker.requestMediaLibraryPermissionsAsync();
      
      const { granted } = await permissionType;
      
      if (!granted) {
        alert(`Permission to access ${useCamera ? 'camera' : 'library'} is required!`);
        return;
      }

      // Launch image picker
      result = await (useCamera 
        ? ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          }));

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImage(result.assets[0].uri);
        await getPrediction(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picking error:', error);
      setError('Failed to select image');
    }
  };

  const clearOutput = () => {
    setImage(null);
    setResult('');
    setLabel('');
    setError('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Potato Disease Prediction</Text>
      
      {image ? (
        <>
          <Image source={{ uri: image }} style={styles.image} />
          <TouchableOpacity onPress={clearOutput} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.instructions}>
          Select an image of a potato leaf to check for diseases
        </Text>
      )}

      {isLoading ? (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.statusText}>Analyzing image...</Text>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          {label && <Text style={styles.resultLabel}>Diagnosis: {label}</Text>}
          {result && <Text style={styles.resultLabel}>Confidence: {result}%</Text>}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cameraButton]}
          onPress={() => pickImage(true)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.galleryButton]}
          onPress={() => pickImage(false)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: '#2196F3',
  },
  galleryButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultContainer: {
    marginVertical: 20,
    alignItems: 'center',
    minHeight: 80,
  },
  resultLabel: {
    fontSize: 18,
    marginVertical: 5,
    color: '#333',
    fontWeight: '500',
  },
  instructions: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
  },
  clearButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#f44336',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default App;