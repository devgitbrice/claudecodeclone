// lib/agent/planner.ts

import {
  BaseMessage,
  SystemMessage,
  HumanMessage,
} from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Prompt système commun
 * Très important pour éviter les hallucinations et patches invalides
 */
const SYSTEM_PROMPT = `
Tu es un agent de modification de code expert.

RÈGLES STRICTES (OBLIGATOIRES) :
- Tu ne supposes jamais le contenu d’un fichier.
- Tu ne modifies que des fichiers qui ont été lus explicitement.
- Tu raisonnes étape par étape, mais tu ne montres PAS ton raisonnement interne.
- Tu aides à diagnostiquer et corriger des bugs réels.

RÈGLES POUR LES PATCHES :
- Toute modification DOIT être fournie sous forme de PATCH GIT UNIFIÉ.
- Le patch doit commencer par "diff --git".
- Aucun texte explicatif hors du patch.
- Si tu n’es pas certain de la correction, NE PRODUIS PAS DE PATCH.
`;

/**
 * Utilisé pour la réponse finale (diagnostic / explication)
 */
export async function runPlanner(
  model: BaseChatModel,
  messages: BaseMessage[]
): Promise<string> {
  const response = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    ...messages,
    new HumanMessage(
      "Explique clairement le problème identifié et la solution recommandée."
    ),
  ]);

  return response.content as string;
}

/**
 * Utilisé pour générer un PATCH GIT UNIFIÉ
 */
export async function generatePatch(
  model: BaseChatModel,
  messages: BaseMessage[]
): Promise<string> {
  const response = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    ...messages,
    new HumanMessage(
      "Génère maintenant le patch git unifié pour corriger le problème. " +
        "Respecte STRICTEMENT les règles sur le format du patch."
    ),
  ]);

  return response.content as string;
}
