/* eslint-disable react-native/no-inline-styles */
import Slider from '@react-native-community/slider';
import React, {useEffect, useRef, useState} from 'react';

import {
  ImageBackground,
  LogBox,
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
  start: [];
  text: [];
}

LogBox.ignoreAllLogs();
LogBox.ignoreLogs(['Warning: ...']);

const App: () => React.ReactNode = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [currentWord, setCurrentWord] = useState<number>(0);
  const [musicTime, setMusicTime] = useState<number[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);

  const {position: currentPosition, duration: currentDuration} =
    useProgress(100);

  useEffect(() => {
    setPosition(currentPosition);
    setDuration(currentDuration);
    updateLyrics(currentPosition);
    if (scrollViewRef.current && currentWord !== -1) {
      scrollViewRef.current.scrollTo({y: currentWord * 2, animated: true});
    }
  }, [currentPosition, currentDuration, currentWord]);

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
        spaces: 1,
        attributeValueFn: (value: string) => parseFloat(value),
      };
      const jsonData = xmljs.xml2json(xmlData, options);
      const json = JSON.parse(jsonData);
      const params = json.data.param;
      const time: any[] | ((prevState: number[]) => number[]) = [];

      const lyricsData = params.map((param: any, index: number) => {
        time.push(param.i.map((item: any) => item._attributes.va));
        return {
          index,
          start: parseFloat(param.i[0]._attributes.va),
          text: param.i.map((item: any) => item._text),
        };
      });
      setMusicTime(time.flat());
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
    const currentWord = musicTime.findIndex(music => music > currentPosition);
    console.log(currentWord);
    setCurrentWord(currentWord > 0 ? currentWord - 1 : 0);
  };

  // link image
  const image = {
    uri: 'https://cdn.pixabay.com/photo/2016/05/05/02/37/sunset-1373171_1280.jpg',
  };

  // format time
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  let flat = -1;

  return (
    <ImageBackground source={image} resizeMode="cover" style={styles.image}>
      <View style={{flex: 1, justifyContent: 'flex-end', alignItems: 'center'}}>
        <ScrollView
          ref={scrollViewRef}
          style={{marginTop: 40, maxHeight: 60, padding: 10}}
          contentContainerStyle={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}>
          {lyrics.map((lyric, index) => {
            return (
              <Text
                key={index}
                style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                {lyric.text.map((text, number) => {
                  flat++;
                  return (
                    <Text
                      key={number}
                      style={{
                        textAlign: 'left',
                        opacity: flat >= currentWord ? 1 : 0.2,
                        color: flat === currentWord ? 'red' : 'white',
                        lineHeight: 20,
                        fontSize: 16,
                      }}>
                      {text}
                    </Text>
                  );
                })}
              </Text>
            );
          })}
        </ScrollView>
        <View>
          <View
            style={{
              width: '75%',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 14, color: 'white'}}>
              {formatTime(position)}
            </Text>
            <Text style={{fontSize: 14, color: 'white'}}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>
        <Slider
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={handleSeek}
          style={{width: '80%', marginVertical: 2}}
        />
        <TouchableOpacity
          onPress={togglePlayback}
          style={{
            padding: 10,
            backgroundColor: 'lightblue',
            marginBottom: 20,
            borderRadius: 10,
          }}>
          <Text>{isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
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

export default App;
