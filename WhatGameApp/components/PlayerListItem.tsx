import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar, Text, useTheme } from 'react-native-paper';

interface PlayerListItemProps {
  id: string;
  name: string;
  isHost?: boolean;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({ id, name, isHost = false }) => {
  const theme = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Avatar.Text 
        size={40} 
        label={name.charAt(0).toUpperCase()}
        style={styles.avatar}
        color={theme.colors.primary}
      />
      <View style={styles.textContainer}>
        <Text variant="titleMedium" numberOfLines={1}>
          {name} {isHost && '👑'}
        </Text>
        <Text variant="bodySmall" style={styles.id} numberOfLines={1}>
          ID: {id}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    elevation: 1,
  },
  avatar: {
    marginRight: 16,
    backgroundColor: 'transparent',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  id: {
    fontSize: 12,
    color: '#666',
  },
});

export default PlayerListItem;