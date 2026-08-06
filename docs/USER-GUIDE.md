# Dune QoL — Guide utilisateur / User guide

Ce fichier est l’unique manuel utilisateur du module. Il est complété au fur et à mesure des fonctionnalités, sans créer un document séparé pour chaque bouton.

## Français

### Test guidé et lanceur natif

Le système Dune fournit son propre **Dune Dice Roller**. **Dune QoL** fournit la fenêtre **Test guidé — …**, qui ajoute notamment la difficulté, le Momentum généré, la source des dés supplémentaires, la Détermination et des actions directement dans le résultat du chat.

L’option **Masquer le lanceur de dés natif de Dune** est activée par défaut dans les réglages du module. Elle masque les boutons natifs détectés sans modifier les fichiers du système.

### Ouvrir le Test guidé

Par défaut :

1. ouvrez une fiche de personnage Dune ;
2. cliquez sur **Test guidé** dans la barre de titre.

Cette méthode fonctionne sans scène active.

Le réglage **Emplacement du test guidé** propose :

- **Fiche de personnage** ;
- **Contrôles de token**, avec une scène active ;
- **Fiche de personnage et contrôles de token**.

Depuis les contrôles de token, un token sélectionné est utilisé. Sans sélection, le personnage attribué à l’utilisateur est utilisé. Plusieurs tokens sélectionnés ou des droits insuffisants produisent un avertissement.

### Champs du test

- **Compétence** et **Motivation** sont lues sur le personnage.
- **Spécialisation** est facultative.
- **Difficulté** indique le nombre de succès nécessaires.
- **Nombre total de dés** accepte de 2 à 5 d20.
- **Plage de complication** accepte une valeur de 15 à 20.
- **Source des dés supplémentaires** devient disponible à partir de 3 dés.
- **Détermination** dépense un point et ajoute un résultat automatique de 1.
- **Contexte du test** ajoute une courte description au résultat.

Le coût progressif des dés supplémentaires est de 0, 1, 3 ou 6 Momentum/Menace pour 2, 3, 4 ou 5 dés.

### Résultat dans le chat

La carte affiche les paramètres du test, chaque résultat de dé, les succès, la réussite ou l’échec, le Momentum généré, les complications et les actions disponibles.

### Appliquer le Momentum et la Menace

Le résultat calcule les changements proposés aux réserves partagées.

Exemples :

- aucun achat et 2 Momentum générés : **Momentum +2** ;
- un dé acheté pour 1 Momentum et 2 générés : **Momentum +1** ;
- deux dés achetés avec la Menace et 1 Momentum généré : **Momentum +1, Menace +3**.

Les réserves ne changent pas au moment du jet. Cliquez sur **Appliquer les changements** :

- le MJ applique directement la transaction ;
- un joueur envoie une demande au MJ actif ;
- le résultat est marqué comme appliqué ;
- un message d’historique indique les valeurs avant et après.

Le Momentum utilisé pour acheter les dés doit être disponible avant le jet. Le Momentum généré ne peut pas financer rétroactivement l’achat. La réserve finale est plafonnée à 6.

### Créer un Trait depuis une complication

À partir de la version `0.4.0`, un résultat comportant au moins une complication affiche une section **Résolution des complications**.

Pour chaque complication :

1. cliquez sur **Créer un Trait de complication** ;
2. donnez un nom au Trait ;
3. laissez **Trait temporaire** coché, sauf si le Trait doit réellement persister ;
4. confirmez.

Le module :

- crée un Item de type `trait` directement sur le personnage associé au jet ;
- utilise le champ temporaire natif du système Dune ;
- comptabilise un Trait créé comme une complication résolue ;
- affiche les Traits déjà créés et le nombre restant ;
- ajoute un message d’historique dans le chat.

Un joueur possédant le personnage peut demander la création, mais un MJ actif effectue l’écriture autoritaire. Chaque complication permet la création d’un seul Trait. La suppression ultérieure du Trait sur la fiche ne rouvre pas automatiquement la complication d’origine.

### Choisir la langue

Dans :

**Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL → Langue du module**

choisissez **English** ou **Français**, puis rechargez la page. Ce réglage ne change que Dune QoL.

### Dépannage

#### Le bouton des contrôles de token ne fait rien

Une scène active est nécessaire. Utilisez le bouton de la fiche de personnage ou activez une scène.

#### La source des dés supplémentaires reste inaccessible

Vérifiez que le module est au minimum en version `0.3.1`, puis rechargez complètement la partie. Le champ doit être désactivé à 2 dés et actif à partir de 3 dés.

#### Le bouton est visible, mais aucune fenêtre ne s’ouvre

Ouvrez **F12 → Console**, reproduisez le problème et copiez l’erreur complète préfixée `Dune QoL`.

#### « Un maître de jeu actif est nécessaire »

Connectez au moins un compte MJ actif. Les réserves partagées et la création de Traits demandée par un joueur sont exécutées par le MJ.

#### Le Trait n’apparaît pas

Vérifiez la fiche du personnage associé au jet, dans sa liste de Traits. Si une erreur apparaît, copiez la notification et l’entrée `Dune QoL` de la console.

#### Mettre à jour le module

Depuis l’écran Setup de Foundry, utilisez **Update**, puis rechargez Foundry. Pendant la pré-alpha, le manifeste télécharge l’état courant de `main`.

---

## English

### Guided test and the native roller

The Dune system provides **Dune Dice Roller**. Dune QoL provides **Guided test — …**, adding difficulty, generated Momentum, extra-die source, Determination and chat-card actions.

**Hide the native Dune dice roller** is enabled by default. It hides detected launcher buttons without modifying upstream files.

### Opening Guided test

By default, open a supported Actor sheet and click **Guided test** in its title bar. This works without an active Scene.

The launcher setting offers Actor sheet, Token controls, or both. Token controls use one selected token or the user’s assigned character.

### Test fields

Choose Skill, Drive, optional Focus, difficulty, total dice, complication range, extra-die source, optional Determination and optional context. The extra-die source becomes available from 3 dice onward.

### Applying Momentum and Threat

The result card proposes shared-pool changes. The pools are not changed until **Apply resource changes** is clicked.

A game master applies directly. A player sends the request to the active game master. The source message is marked as applied and a separate history card records before and after values.

Momentum spent on extra dice must already exist before the test. Generated Momentum cannot retroactively pay that cost. Final Momentum is capped at 6.

### Creating a Trait from a complication

Starting with version `0.4.0`, a result with complications displays **Complication resolution**.

For each complication:

1. click **Create a complication Trait**;
2. enter the Trait name;
3. leave **Temporary Trait** selected unless it should persist;
4. confirm.

The module creates an embedded upstream `trait` Item on the Actor, records it on the source result and posts a history message. One Trait may be created for each complication. A player request is executed by the active game master.

Deleting the Trait later does not automatically reopen the original complication.

### Language

Open **Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL → Module language**, choose **English** or **Français**, then reload.

### Troubleshooting

Token controls require an active Scene. The extra-die source requires module `0.3.1` or newer and at least 3 dice. Player pool and Trait requests require an active game master.

For runtime errors, press **F12**, reproduce the issue and copy the complete console entry prefixed with `Dune QoL`.
