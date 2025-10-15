![WhatGame logo](https://raw.githubusercontent.com/KevinTheSome/WhatGameApp/fc7837e3b139c4e01ab16e8608e76f134518a26f/assets/icon.png)

WhatGame is a mobile app designed to help you and your friends decide what game to play next. No more endless debates—create lobbies with friends, discover exciting games, and vote to pick the perfect one!

## Features

- **Friends Lobbies**: Easily create or join lobbies with your friends to coordinate gaming sessions.
- **Game Discovery**: Browse a curated selection of games tailored to your group's preferences.
- **Voting System**: Vote on suggested games in real-time to quickly decide what to play together.

## Tech Stack

- **Frontend**: React Native with Expo for a smooth cross-platform mobile experience (iOS and Android).
- **Backend**: Laravel (PHP framework) for robust API development, user authentication, and data management.

## Getting Started

### Prerequisites

- Node.js (for frontend development)
- PHP 8.1+ and Composer (for backend)
- Expo CLI: `npm install -g @expo/cli`
- A database like MySQL or SQLite (configured in Laravel)

### Frontend Setup (React Native + Expo)

1. Clone the repository:
   ```
   git clone <your-repo-url>
   cd WhatGame/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   expo start
   ```

4. Open the app in Expo Go on your mobile device or use an emulator.

### Backend Setup (Laravel)

1. Navigate to the backend directory:
   ```
   cd WhatGame/backend
   ```

2. Install dependencies:
   ```
   composer install
   ```

3. Copy the environment file:
   ```
   cp .env.example .env
   ```

4. Generate application key:
   ```
   php artisan key:generate
   ```

5. Configure your database in `.env` and run migrations:
   ```
   php artisan migrate
   ```

6. Start the server:
   ```
   php artisan serve
   ```

### API Integration

Update the frontend's API base URL in the Expo config to point to your Laravel backend (e.g., `http://localhost:8000` for local development).

## Contributing

Contributions are welcome! Please fork the repo and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
