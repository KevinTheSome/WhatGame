import { View, StyleSheet, SafeAreaView, PanResponder, Animated, Dimensions } from "react-native";
import { Text, Button, useTheme, IconButton } from "react-native-paper";
import { useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState, useRef } from "react";
import * as SecureStore from "expo-secure-store";
const { width } = Dimensions.get('window');

const AnswerCard = ({ answer, onSwipe, onSwipeComplete, isActive = true }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const likeOpacity = useRef(new Animated.Value(0)).current;
  const dislikeOpacity = useRef(new Animated.Value(0)).current;
  const theme = useTheme();
  
  const [error, setError] = useState<string | null>(null);
  const [currentGame,setCurrentGame] = useState<object | null>(null);

  useEffect(() => {
    const intervalId = setInterval(fetchLobbyInfo, 2000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchLobbyInfo = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/getCurrentGame`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await SecureStore.getItemAsync("token")}`,
          },
        }
      );
      const data = await response.json();
      if (data["error"]) {
        setError(data["error"]);
      } else {
        // setLobby(data);
        setError(null);
      }
    } catch (error) {
      setError("Failed to fetch lobby info");
      console.error(error);
    }
  };


  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      pan.setValue({ x: gestureState.dx, y: 0 });
      
      if (gestureState.dx > 0) {
        likeOpacity.setValue(Math.min(gestureState.dx / 100, 0.5));
        dislikeOpacity.setValue(0);
      } else if (gestureState.dx < 0) {
        dislikeOpacity.setValue(Math.min(Math.abs(gestureState.dx) / 100, 0.5));
        likeOpacity.setValue(0);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) > 50) {
        Animated.parallel([
          Animated.timing(pan, {
            toValue: { x: gestureState.dx * 2, y: 0 },
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start(() => {
          onSwipe(gestureState.dx > 0 ? 'like' : 'dislike');
          onSwipeComplete();
        });
      } else {

        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: false,
        }).start();
        
        Animated.parallel([
          Animated.timing(likeOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(dislikeOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start();
      }
    },
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          opacity: opacity,
          zIndex: isActive ? 10 : 5,
          backgroundColor: theme.colors.background,
        },
      ]}
      {...(isActive ? panResponder.panHandlers : {})}
    >
      <Text style={styles.answerText}>{answer}</Text>
      
      <Animated.View style={[styles.likeIndicator, { opacity: likeOpacity }]}>
        <Text style={styles.likeText}>LIKE</Text>
      </Animated.View>
      <Animated.View style={[styles.dislikeIndicator, { opacity: dislikeOpacity }]}>
        <Text style={styles.dislikeText}>NOPE</Text>
      </Animated.View>
    </Animated.View>
  );
};

export default function VotingView() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  
  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(0);
  // Show current and next card in the stack
  const [displayedCards, setDisplayedCards] = useState([0, 1]);
  const answers = [
    "This is answer 1",
    "This is answer 2",
    "This is answer 3",
    "No more answers!"
  ];

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleVote = (vote: 'like' | 'dislike') => {
    console.log(`Voted ${vote} on answer: ${answers[currentAnswerIndex]}`);
    goToNextAnswer();
  };

  const handleSwipe = (direction: 'like' | 'dislike') => {
    handleVote(direction);
  };

  const goToNextAnswer = () => {
    if (currentAnswerIndex < answers.length - 1) {
      const nextIndex = currentAnswerIndex + 1;
      // Update the current index first
      setCurrentAnswerIndex(nextIndex);
      
      // Then update the displayed cards to include the next one in the stack
      if (nextIndex + 1 < answers.length) {
        setDisplayedCards([nextIndex, nextIndex + 1]);
      } else {
        setDisplayedCards([nextIndex]);
      }
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Vote on Answers
        </Text>
        
        <View style={[styles.cardContainer, { backgroundColor: theme.colors.background }]}>
          {currentAnswerIndex < answers.length ? (
            <>
              {displayedCards.map((index) => (
                <AnswerCard
                  key={index}
                  answer={answers[index]}
                  onSwipe={handleSwipe}
                  onSwipeComplete={goToNextAnswer}
                  isActive={index === currentAnswerIndex}
                />
              )).reverse()}
            </>
          ) : (
            <Text style={styles.noMoreText}>No more answers to vote on!</Text>
          )}
        </View>

        <View style={[styles.buttonsContainer, { backgroundColor: theme.colors.background }]}>
          <IconButton
            icon="close"
            iconColor="#F44336"
            size={40}
            onPress={() => handleVote('dislike')}
            style={[styles.button, styles.dislikeButton, { backgroundColor: theme.colors.background }]}
            disabled={currentAnswerIndex >= answers.length}
          />
          <IconButton
            icon="heart"
            iconColor="#4CAF50"
            size={40}
            onPress={() => handleVote('like')}
            style={[styles.button, styles.likeButton, { backgroundColor: theme.colors.background }]}
            disabled={currentAnswerIndex >= answers.length}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
  },
  cardContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '90%',
    height: 200,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'absolute',
    zIndex: 1,
  },
  answerText: {
    fontSize: 18,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 20,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  likeButton: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  dislikeButton: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  likeIndicator: {
    position: 'absolute',
    left: 20,
    top: 20,
    borderColor: '#4CAF50',
    borderWidth: 2,
    padding: 5,
    borderRadius: 5,
    transform: [{ rotate: '-15deg' }],
  },
  dislikeIndicator: {
    position: 'absolute',
    right: 20,
    top: 20,
    borderColor: '#F44336',
    borderWidth: 2,
    padding: 5,
    borderRadius: 5,
    transform: [{ rotate: '15deg' }],
  },
  likeText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dislikeText: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noMoreText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },
});
