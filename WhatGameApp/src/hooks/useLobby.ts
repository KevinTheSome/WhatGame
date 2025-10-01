import { useState, useEffect } from "react";

interface Player {
    id: string;
    name: string;
    ready?: boolean;
}

type LobbyStatus = "waiting" | "ready" | "started";

export const useLobby = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [status, setStatus] = useState<LobbyStatus>("waiting");

    const joinLobby = (player: Omit<Player, "ready">) => {
        setPlayers((prev) => [...prev, { ...player, ready: false }]);
    };

    const leaveLobby = (playerId: string) => {
        setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    };

    const updatePlayerReady = (playerId: string, ready: boolean) => {
        setPlayers((prev) =>
            prev.map((p) => (p.id === playerId ? { ...p, ready } : p)),
        );
    };

    const startGame = () => {
        if (status === "ready") {
            setStatus("started");
        }
    };

    useEffect(() => {
        if (players.length === 0) {
            setStatus("waiting");
            return;
        }

        if (status === "started") {
            return;
        }

        const allReady = players.every((p) => p.ready ?? false);
        setStatus(allReady ? "ready" : "waiting");
    }, [players]);

    return {
        players,
        setPlayers,
        status,
        setStatus,
        joinLobby,
        leaveLobby,
        updatePlayerReady,
        startGame,
    };
};
