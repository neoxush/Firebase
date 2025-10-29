
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// This function is triggered when a new game session is created.
// It updates the user's XP and level based on the game's score.
export const onFinalizeGameSession = functions.firestore
  .document("gameSessions/{sessionId}")
  .onCreate(async (snap, context) => {
    const gameSession = snap.data();
    const userId = gameSession.userId;
    const score = gameSession.score;

    const userRef = admin.firestore().collection("users").doc(userId);

    return admin.firestore().runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error("User not found!");
      }

      const newXp = (userDoc.data()?.xp || 0) + score;
      // Simple leveling system: 1000 XP per level
      const newLevel = Math.floor(newXp / 1000);

      transaction.update(userRef, { xp: newXp, level: newLevel });
    });
  });
