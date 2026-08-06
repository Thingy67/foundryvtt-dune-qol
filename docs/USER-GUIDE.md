# Dune QoL — Guide utilisateur / User guide

Ce fichier est l’unique manuel utilisateur du module. Il sera complété au fur et à mesure des fonctionnalités, sans créer un document séparé pour chaque bouton.

## Français

### Pourquoi plusieurs lanceurs de dés ?

Le système Dune fournit son propre **Dune Dice Roller**. Son apparence change selon qu’un personnage est disponible ou non :

- sans personnage exploitable, il affiche un formulaire générique avec seuil manuel ;
- avec un token ou un personnage attribué, il affiche les Compétences et Motivations ;
- **Dune QoL** ajoute une troisième fenêtre intitulée **Test guidé — …**.

Le Test guidé couvre le même besoin principal, mais ajoute la difficulté, le Momentum généré, la source et le coût des dés supplémentaires, une meilleure gestion de la Détermination et une carte de résultat plus lisible. Il est donc considéré comme l’interface principale du module.

Dans **Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL**, l’option **Masquer le lanceur de dés natif de Dune** est activée par défaut. Elle masque les boutons natifs détectés, sans modifier le code du système Dune. Désactivez-la pour retrouver les deux interfaces.

### Ouvrir le Test guidé

Par défaut :

1. ouvrez une fiche de personnage Dune ;
2. cliquez sur le bouton **Test guidé** avec l’icône d20 dans la barre de titre.

Cette méthode fonctionne même sans scène active.

Le réglage **Emplacement du test guidé** propose :

- **Fiche de personnage** — valeur par défaut ;
- **Contrôles de token** — bouton dans la barre d’outils de scène, nécessitant une scène active ;
- **Fiche de personnage et contrôles de token** — active les deux accès.

Lors d’un lancement depuis les contrôles de token :

1. le token sélectionné est utilisé ;
2. sans token sélectionné, le personnage attribué à l’utilisateur est utilisé ;
3. plusieurs tokens sélectionnés déclenchent un avertissement ;
4. il faut posséder les droits sur le personnage.

### Champs du test

- **Compétence** et **Motivation** sont lues sur le personnage.
- **Spécialisation** est facultative ; renseignez-la seulement si elle s’applique.
- **Difficulté** indique le nombre de succès nécessaires.
- **Nombre total de dés** accepte de 2 à 5 d20.
- **Plage de complication** accepte une valeur de 15 à 20.
- **Source des dés supplémentaires** indique comment ils ont été obtenus.
- **Détermination** dépense un point du personnage et ajoute un résultat automatique de 1.
- **Contexte du test** ajoute une courte description au résultat.

Le coût progressif des dés supplémentaires est indiqué : 0, 1, 3 ou 6 Momentum/Menace pour un total de 2, 3, 4 ou 5 dés. En version 0.2.0, le module n’altère pas encore automatiquement les réserves partagées.

### Résultat dans le chat

La carte affiche :

- la Compétence, la Motivation et le seuil ;
- la Spécialisation, la difficulté et la plage de complication ;
- chaque résultat de dé ;
- les succès ;
- la réussite ou l’échec ;
- le Momentum généré ;
- les complications ;
- la Détermination et la source des dés supplémentaires lorsqu’elles sont utilisées.

### Choisir la langue

Dans :

**Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL → Langue du module**

choisissez **English** ou **Français**. Ce réglage ne change que Dune QoL, pas Foundry ni le système Dune. Rechargez la page après la modification.

### Dépannage

#### Le bouton des contrôles de token ne fait rien

Les contrôles de token n’existent qu’avec une scène active. Utilisez le bouton de la fiche de personnage ou activez une scène.

#### Le bouton est visible, mais aucune fenêtre ne s’ouvre

Le module affiche désormais une notification et écrit une erreur préfixée `Dune QoL` dans la console. Ouvrez la console avec **F12**, reproduisez le problème et copiez l’erreur complète.

#### Les boutons natifs sont encore visibles

Vérifiez que **Masquer le lanceur de dés natif de Dune** est activé, puis rechargez Foundry. La détection dépend des contrôles exposés par la version du système ; signalez tout bouton restant avec une capture d’écran.

#### Mettre à jour le module

Depuis l’écran Setup de Foundry, utilisez **Update** sur le module, puis rechargez Foundry. Pendant la pré-alpha, le manifeste télécharge l’état courant de la branche `main`.

---

## English

### Why are there several dice windows?

The upstream Dune system owns **Dune Dice Roller**. It uses a generic layout when no usable Actor is available and an Actor-aware layout when a token or assigned character is available. Dune QoL owns **Guided test — …**.

Guided test serves the same main purpose but adds difficulty, generated Momentum, extra-die cost and source, Determination handling and a clearer result card. It is the module’s preferred interface.

The **Hide the native Dune dice roller** setting is enabled by default. It hides detected native launcher buttons without modifying upstream files.

### Opening Guided test

By default, open a supported Actor sheet and click the **Guided test** d20 button in its title bar. This works without an active Scene.

The **Guided test launcher** setting offers:

- **Actor sheet** — default;
- **Token controls** — requires an active Scene;
- **Actor sheet and Token controls** — enables both.

From Token controls, one selected token is used; otherwise the user’s assigned character is used. Multiple selected tokens or insufficient ownership produce warnings.

### Fields and result

Choose Skill, Drive, optional Focus, difficulty, total dice, complication range, extra-die source, optional Determination and optional context. The chat card displays the complete test context, individual dice, successes, success or failure, generated Momentum and complications.

Version 0.2.0 reports extra-die costs but does not yet change shared Momentum or Threat pools.

### Language

Open **Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL → Module language**, choose **English** or **Français**, then reload. This changes Dune QoL only.

### Troubleshooting

Token controls require an active Scene. Actor-sheet launch does not. If a visible button does not open a window, press **F12**, reproduce the issue and copy the complete console error prefixed with `Dune QoL`.
