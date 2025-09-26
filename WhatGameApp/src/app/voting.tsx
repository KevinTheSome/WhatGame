import { View, StyleSheet, SafeAreaView, Dimensions } from "react-native";
import { Text, useTheme, IconButton } from "react-native-paper";
import { useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import AnswerCard from '../../components/AnswerCard';

export default function VotingView() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  
  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(0);
  // Show current and next card in the stack
  const [displayedCards, setDisplayedCards] = useState([0, 1]);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<object[] | null>(null);
  const [currentGame, setCurrentGame] = useState<object | null>(null);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const intervalId = setInterval(fetchLobbyInfo, 2000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchLobbyInfo = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/getVoteGames`,
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
        setGames(data["games"]);
        setError(null);
      }
    } catch (error) {
      setError("Failed to fetch lobby info");
      console.error(error);
    }
  };

  const handleVote = (vote: 'like' | 'dislike') => {
    console.log(`Voted ${vote} on game:`, games?.[currentAnswerIndex]);
    goToNextAnswer();
  };

  const handleSwipe = (direction: 'like' | 'dislike') => {
    handleVote(direction);
  };

  const goToNextAnswer = () => {
    if (games && currentAnswerIndex < games.length - 1) {
      const nextIndex = currentAnswerIndex + 1;
      // Update the current index first
      setCurrentAnswerIndex(nextIndex);
      
      // Then update the displayed cards to include the next one in the stack
      if (nextIndex + 1 < games.length) {
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
          Vote on Games
        </Text>
        
        <View style={[styles.cardContainer, { backgroundColor: theme.colors.background }]}>
          {games && currentAnswerIndex < games.length ? (
            <>
              {displayedCards.map((index) => (
                <AnswerCard
                  key={index}
                  game={games[index] as any}
                  onSwipe={handleSwipe}
                  onSwipeComplete={goToNextAnswer}
                  isActive={index === currentAnswerIndex}
                />
              )).reverse()}
            </>
          ) : (
            <Text style={styles.noMoreText}>No more games to vote on!</Text>
          )}
        </View>

        <View style={[styles.buttonsContainer, { backgroundColor: theme.colors.background }]}>
          <IconButton
            icon="close"
            iconColor="#F44336"
            size={40}
            onPress={() => handleVote('dislike')}
            style={[styles.button, styles.dislikeButton, { backgroundColor: theme.colors.background }]}
            disabled={games ? currentAnswerIndex >= games.length : true}
          />
          <IconButton
            icon="heart"
            iconColor="#4CAF50"
            size={40}
            onPress={() => handleVote('like')}
            style={[styles.button, styles.likeButton, { backgroundColor: theme.colors.background }]}
            disabled={games ? currentAnswerIndex >= games.length : true}
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
