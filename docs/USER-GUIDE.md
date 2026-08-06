# Dune QoL — Guide utilisateur / User guide

Ce fichier est l’unique manuel utilisateur du module. Il sera complété au fur et à mesure des fonctionnalités, sans créer un document séparé pour chaque bouton.

## Français

### Pourquoi plusieurs lanceurs de dés ?

Le système Dune fournit son propre **Dune Dice Roller**. Son apparence change selon qu’un personnage est disponible ou non :

- sans personnage exploitable, il affiche un formulaire générique avec seuil manuel ;
- avec un token ou un personnage attribué, il affiche les Compétences et Motivations ;
- **Dune QoL** ajoute une fenêtre intitulée **Test guidé — …**.

Le Test guidé couvre le même besoin principal, mais ajoute la difficulté, le Momentum généré, la source et le coût des dés supplémentaires, la Détermination et une carte de résultat plus lisible. Il est considéré comme l’interface principale du module.

Dans **Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL**, l’option **Masquer le lanceur de dés natif de Dune** est activée par défaut. Elle masque les boutons natifs détectés sans modifier le code du système Dune.

### Ouvrir le Test guidé

Par défaut :

1. ouvrez une fiche de personnage Dune ;
2. cliquez sur le bouton **Test guidé** avec l’icône d20 dans la barre de titre.

Cette méthode fonctionne même sans scène active.

Le réglage **Emplacement du test guidé** propose :

- **Fiche de personnage** — valeur par défaut ;
- **Contrôles de token** — bouton dans la barre d’outils de scène, nécessitant une scène active ;
- **Fiche de personnage et contrôles de token** — active les deux accès.

Lors d’un lancement depuis les contrôles de token :

1. le token sélectionné est utilisé ;
2. sans token sélectionné, le personnage attribué à l’utilisateur est utilisé ;
3. plusieurs tokens sélectionnés déclenchent un avertissement ;
4. il faut posséder les droits sur le personnage.

### Champs du test

- **Compétence** et **Motivation** sont lues sur le personnage.
- **Spécialisation** est facultative ; renseignez-la seulement si elle s’applique.
- **Difficulté** indique le nombre de succès nécessaires.
- **Nombre total de dés** accepte de 2 à 5 d20.
- **Plage de complication** accepte une valeur de 15 à 20.
- **Source des dés supplémentaires** indique comment ils ont été obtenus.
- **Détermination** dépense un point du personnage et ajoute un résultat automatique de 1.
- **Contexte du test** ajoute une courte description au résultat.

Le coût progressif indiqué pour les dés supplémentaires est de 0, 1, 3 ou 6 Momentum/Menace pour un total de 2, 3, 4 ou 5 dés.

### Résultat dans le chat

La carte affiche :

- la Compétence, la Motivation et le seuil ;
- la Spécialisation, la difficulté et la plage de complication ;
- chaque résultat de dé ;
- les succès ;
- la réussite ou l’échec ;
- le Momentum généré ;
- les complications ;
- la Détermination et la source des dés supplémentaires lorsqu’elles sont utilisées.

### Appliquer le Momentum et la Menace

À partir de la version `0.3.0`, le résultat calcule les changements proposés aux réserves partagées.

Exemples :

- un test génère 2 Momentum sans achat : **Momentum +2** ;
- un dé supplémentaire coûte 1 Momentum et le test en génère 2 : **Momentum +1** ;
- deux dés supplémentaires achetés avec la Menace coûtent 3 et le test génère 1 Momentum : **Momentum +1, Menace +3**.

Les réserves ne changent pas au moment du jet. Il faut cliquer sur **Appliquer les changements** dans la carte du résultat.

- Le MJ peut appliquer directement la transaction.
- Un joueur auteur du jet envoie une demande au MJ actif.
- Un MJ doit être connecté pour qu’un joueur puisse modifier les réserves.
- Une seule instance active de MJ exécute la transaction.
- Le résultat est marqué comme déjà appliqué après réussite.
- Un second message dans le chat indique les valeurs avant et après.

Le Momentum servant à acheter les dés doit être disponible avant le jet. Le Momentum généré par le résultat ne peut pas financer rétroactivement l’achat. La réserve finale de Momentum est limitée à 6 ; l’éventuel surplus perdu est indiqué dans l’historique.

> [!CAUTION]
> L’accès technique aux réserves du système Dune 13.0.1 est encore en validation. En cas d’échec, le module ne modifie rien silencieusement : il affiche une erreur et écrit un diagnostic `Dune QoL` dans la console.

### Choisir la langue

Dans :

**Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL → Langue du module**

choisissez **English** ou **Français**. Ce réglage ne change que Dune QoL, pas Foundry ni le système Dune. Rechargez la page après la modification.

Les intitulés et descriptions des réglages sont eux aussi remplacés dans la langue choisie lors de l’affichage de la fenêtre de configuration.

### Dépannage

#### Le bouton des contrôles de token ne fait rien

Les contrôles de token n’existent qu’avec une scène active. Utilisez le bouton de la fiche de personnage ou activez une scène.

#### Le bouton est visible, mais aucune fenêtre ne s’ouvre

Le module affiche une notification et écrit une erreur préfixée `Dune QoL` dans la console. Ouvrez la console avec **F12**, reproduisez le problème et copiez l’erreur complète.

#### Les boutons natifs sont encore visibles

Vérifiez que **Masquer le lanceur de dés natif de Dune** est activé, puis rechargez Foundry. La détection dépend des contrôles exposés par la version du système ; signalez tout bouton restant avec une capture d’écran.

#### « Un maître de jeu actif est nécessaire »

Le joueur ne peut pas modifier directement une réserve partagée. Connectez au moins un compte MJ actif, puis réessayez depuis le résultat du jet.

#### « Dune QoL ne parvient pas à accéder aux réserves »

Aucune modification n’a été appliquée. Ouvrez **F12 → Console**, recherchez le message `Upstream pool API probe failed` et copiez l’objet de diagnostic ainsi que l’erreur complète.

#### Momentum insuffisant

La réserve ne contenait pas assez de Momentum au moment de l’application pour payer les dés déclarés comme achetés avec cette ressource. Le Momentum gagné par le test n’est pas pris en compte pour vérifier ce paiement préalable.

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

### Applying Momentum and Threat

Starting with version `0.3.0`, the result card calculates proposed shared-pool changes.

The pools are not changed when the dice are rolled. Click **Apply resource changes** on the result card:

- a game master applies the transaction directly;
- a player who authored the roll sends the request to the active game master;
- at least one active game master is required;
- one active game master performs the authoritative write;
- the source result is marked as applied;
- a separate chat message records the before and after values.

Momentum spent on extra dice must already exist before the test. Generated Momentum cannot retroactively fund that purchase. Final Momentum is capped at 6 and discarded excess is recorded.

The Dune 13.0.1 pool adapter is still undergoing runtime validation. When no supported upstream interface is detected, the module reports an error and does not silently change state.

### Language

Open **Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL → Module language**, choose **English** or **Français**, then reload. This changes Dune QoL only. The module also replaces its setting labels and hints using the selected language.

### Troubleshooting

Token controls require an active Scene. Actor-sheet launch does not. If a visible button does not open a window, press **F12**, reproduce the issue and copy the complete console error prefixed with `Dune QoL`.

A player needs an active game master to apply pool changes. If the pool adapter fails, copy the console entry `Upstream pool API probe failed`, including its diagnostic object.
