import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useState } from "react";
import { 
  Text, 
  Searchbar, 
  useTheme, 
  Avatar, 
  Divider, 
  Button, 
  SegmentedButtons,
  ActivityIndicator
} from "react-native-paper";

type Friend = {
  id: string;
  name: string;
  avatar: string;
  requestStatus?: 'pending' | 'accepted';
};

export default function FriendsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  // Mock data - replace with your actual data fetching logic
  const [friends, setFriends] = useState<Friend[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      status: 'online',
      game: 'Valorant',
      requestStatus: 'accepted'
    },
    {
      id: '2',
      name: 'Sam Wilson',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      status: 'in-game',
      game: 'League of Legends',
      requestStatus: 'accepted'
    },
    {
      id: '3',
      name: 'Jordan Lee',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      status: 'offline',
      requestStatus: 'pending'
    },
    {
      id: '4',
      name: 'Taylor Smith',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      status: 'online',
      game: 'Apex Legends',
      requestStatus: 'received'
    },
  ]);

  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (activeTab === 'friends' 
      ? friend.requestStatus === 'accepted' 
      : friend.requestStatus !== 'accepted')
  );

  const handleAcceptRequest = (id: string) => {
    // Update friend status to accepted
    setFriends(friends.map(friend => 
      friend.id === id ? { ...friend, requestStatus: 'accepted' } : friend
    ));
  };

  const handleDeclineRequest = (id: string) => {
    // Remove friend request
    setFriends(friends.filter(friend => friend.id !== id));
  };

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <Avatar.Image 
          size={50} 
          source={{ uri: item.avatar }} 
          style={styles.avatar}
        />
        <View style={styles.friendText}>
          <Text variant="titleMedium">{item.name}</Text>
        </View>
      </View>
      
      {activeTab === 'requests' && item.requestStatus === 'received' && (
        <View style={styles.requestButtons}>
          <Button 
            mode="contained" 
            onPress={() => handleAcceptRequest(item.id)}
            style={styles.acceptButton}
          >
            Accept
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => handleDeclineRequest(item.id)}
            style={styles.declineButton}
          >
            Decline
          </Button>
        </View>
      )}
      {activeTab === 'requests' && item.requestStatus === 'pending' && (
        <Text style={styles.pendingText}>Request Pending</Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search for people"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'friends' | 'requests')}
        buttons={[
          {
            value: 'friends',
            label: 'Friends',
            icon: 'account-group',
          },
          {
            value: 'requests',
            label: 'Requests',
            icon: 'account-clock',
          },
        ]}
        style={styles.segmentedButtons}
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Divider style={styles.divider} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium" style={styles.emptyText}>
                {activeTab === 'friends' 
                  ? 'No friends found' 
                  : 'No pending requests'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 16,
  },
  friendText: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    opacity: 0.7,
  },
  requestButtons: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  acceptButton: {
    marginRight: 8,
  },
  declineButton: {
    borderColor: '#F44336',
  },
  pendingText: {
    color: '#FF9800',
    fontStyle: 'italic',
  },
  divider: {
    marginHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    opacity: 0.6,
    textAlign: 'center',
  },
});
