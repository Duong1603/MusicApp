import Slider from '@react-native-community/slider';
import React, {useEffect, useRef, useState} from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import TrackPlayer, {useProgress} from 'react-native-track-player';
import xmljs from 'xml-js';

interface Lyric {
  index: number;
  start: number;
  text: string;
}

const Test: () => React.ReactNode = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [currentLine, setCurrentLine] = useState<number>(-1);

  const scrollViewRef = useRef<ScrollView>(null);

  const {position: currentPosition, duration: currentDuration} =
    useProgress(1000);

  useEffect(() => {
    setPosition(currentPosition);
    setDuration(currentDuration);
    updateLyrics(currentPosition);
    if (scrollViewRef.current && currentLine !== -1) {
      scrollViewRef.current.scrollTo({y: currentLine * 20, animated: true});
    }
  }, [currentPosition, currentDuration, currentLine]);

  useEffect(() => {
    initializeTrackPlayer();
    fetchLyrics();
  }, []);

  // get mp3
  const initializeTrackPlayer = async () => {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.add({
      id: 'trackId',
      url: 'https://storage.googleapis.com/ikara-storage/tmp/beat.mp3',
    });
  };

  // convert xml to json
  const parseLyricTiming = (xmlData: string) => {
    try {
      const options = {
        compact: true,
        spaces: 2,
        attributeValueFn: (value: string) => parseFloat(value),
      };
      const jsonData = xmljs.xml2json(xmlData, options);
      const json = JSON.parse(jsonData);
      const params = json.data.param;

      const lyricsData = params.map((param: any, index: number) => ({
        index,
        start: parseFloat(param.i[0]._attributes.va),
        text: param.i.map((item: any) => item._text).join(''),
      }));

      setLyrics(lyricsData);
    } catch (error) {
      console.error('Error parsing lyrics:', error);
    }
  };

  // get lyrics
  const fetchLyrics = async () => {
    try {
      const response = await fetch(
        'https://storage.googleapis.com/ikara-storage/ikara/lyrics.xml',
      );
      const xmlText = await response.text();
      parseLyricTiming(xmlText);
    } catch (error) {
      console.error('Error fetching lyrics:', error);
    }
  };

  // dừng or chạy
  const togglePlayback = async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
    setIsPlaying(!isPlaying);
  };

  // handle seek
  const handleSeek = async (value: number) => {
    await TrackPlayer.seekTo(value);
  };

  // update lyrics
  const updateLyrics = (currentPosition: number) => {
    const currentLine = lyrics.findIndex(
      lyric => lyric.start > currentPosition,
    );
    setCurrentLine(currentLine > 0 ? currentLine - 1 : 0);
  };

  // link image
  const image = {
    uri: 'https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg',
  };

  // fotmat time
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <ImageBackground source={image} resizeMode="cover" style={styles.image}>
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 20, color: 'white', marginBottom: 20}}>
          Current position: {formatTime(position)}
        </Text>
        <Text style={{fontSize: 20, color: 'white', marginBottom: 20}}>
          Duration: {formatTime(duration)}
        </Text>
        <Slider
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={handleSeek}
          style={{width: '80%', marginVertical: 20}}
        />
        <TouchableOpacity
          onPress={togglePlayback}
          style={{padding: 10, backgroundColor: 'lightblue'}}>
          <Text>{isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
        <ScrollView
          ref={scrollViewRef}
          style={{marginTop: 20, maxHeight: 40}}
          contentContainerStyle={{flexGrow: 1}}>
          {lyrics.map((lyric, index) => (
            <Text
              key={index}
              style={{
                textAlign: 'center',
                opacity: index === currentLine ? 1 : 0.2,
                color: index === currentLine ? 'red' : 'black',
                lineHeight: 20,
              }}>
              {lyric.text}
            </Text>
          ))}
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  image: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default Test;
