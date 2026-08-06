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
- **Contexte du test** ajoute une courte description facultative au résultat.

Le coût progressif des dés supplémentaires est de 0, 1, 3 ou 6 Momentum/Menace pour 2, 3, 4 ou 5 dés.

### Résultat dans le chat

À partir de la version `0.5.4`, les informations sont affichées verticalement afin de rester lisibles dans la colonne étroite du chat :

- Difficulté ;
- Spécialisation ;
- Plage de complication ;
- Nombre total de dés ;
- éventuels dés supplémentaires et Détermination.

Chaque information occupe sa propre ligne. La couleur rouge ou verte sert d’accent sur le résultat, sans colorer tout le texte de la carte.

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

Un résultat comportant au moins une complication affiche une section **Résolution des complications**.

Pour chaque complication :

1. cliquez sur **Créer un Trait de complication** ;
2. donnez un nom au Trait ;
3. laissez **Trait temporaire** coché, sauf si le Trait doit réellement persister ;
4. confirmez.

Le module crée un Item de type `trait` directement sur le personnage, utilise le champ temporaire natif, comptabilise la complication résolue et ajoute un message d’historique.

Un joueur possédant le personnage peut demander la création, mais un MJ actif effectue l’écriture autoritaire. Chaque complication permet la création d’un seul Trait.

### Gérer les Traits temporaires

À partir de la version `0.6.0`, la barre de titre de la fiche contient **Traits temporaires** pour le MJ et le propriétaire du personnage.

1. Ouvrez la fiche concernée.
2. Cliquez sur **Traits temporaires**.
3. Cochez un ou plusieurs Traits.
4. Choisissez :
   - **Rendre persistants** pour désactiver leur état temporaire ;
   - **Supprimer** pour retirer définitivement les Items.

La liste ne montre que les Items de type `trait` dont le champ natif `system.temporary` est actif. Les Traits créés depuis une complication affichent un badge **Complication**.

Pour un joueur, l’action est envoyée au MJ actif, qui vérifie que le joueur possède toujours le personnage et que les Items sélectionnés sont encore temporaires. Un message dans le chat conserve la liste des Traits modifiés.

Lorsqu’un Trait de complication est rendu persistant, le module tente également de mettre à jour sa provenance sur le résultat d’origine. Lorsqu’il est supprimé, la suppression est enregistrée mais **la complication reste résolue** : supprimer le Trait ne permet pas d’en créer automatiquement un nouveau pour le même résultat.

### Demander un test en tant que MJ

Le MJ peut préparer et imposer un test directement depuis la fiche du personnage concerné.

1. Ouvrez la fiche du personnage.
2. Cliquez sur **Demander un test** dans la barre de titre.
3. Choisissez le joueur destinataire parmi les utilisateurs possédant ce personnage.
4. Indiquez la difficulté et la plage de complication.
5. Le contexte est facultatif.
6. Pour la **Compétence** et la **Motivation** :
   - sélectionnez une valeur pour l’imposer au joueur ;
   - laissez **Au choix du joueur** pour lui laisser ce choix.
7. La **Spécialisation proposée** reste indicative et modifiable.
8. Cliquez sur **Envoyer la demande**.

Dans la fenêtre reçue par le joueur, toute Compétence ou Motivation imposée est affichée mais désactivée. Les valeurs laissées libres restent sélectionnables.

La demande est conservée à la fois dans un message privé et dans une file persistante sur le compte du joueur. Le client joueur consulte cette file à la connexion et lorsqu’elle est mise à jour.

### Fin d’une demande de test

Le bouton **Ouvrir le test** reste disponible tant qu’aucun résultat n’a été créé :

- ouvrir la fenêtre ne termine pas la demande ;
- fermer ou annuler ne termine pas la demande ;
- rouvrir la demande reste possible.

Lorsque le joueur clique sur **Lancer le test** et que le résultat apparaît dans le chat, le module associe ce résultat à la demande. Le MJ actif vérifie l’auteur, le personnage et le destinataire, puis marque la demande comme terminée. Le bouton **Ouvrir le test** disparaît ensuite.

### Choisir la langue

Dans :

**Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL → Langue du module**

choisissez **English** ou **Français**, puis rechargez la page. Ce réglage ne change que Dune QoL.

### Dépannage

#### Le bouton des contrôles de token ne fait rien

Une scène active est nécessaire. Utilisez le bouton de la fiche de personnage ou activez une scène.

#### La source des dés supplémentaires reste inaccessible

Vérifiez que le module est au minimum en version `0.3.1`, puis rechargez complètement la partie. Le champ doit être désactivé à 2 dés et actif à partir de 3 dés.

#### Aucun Trait n’apparaît dans le gestionnaire

Seuls les Items de type `trait` ayant `system.temporary: true` sont affichés. Un Trait déjà persistant n’apparaît pas. Vérifiez également que les deux clients utilisent la version `0.6.0` ou ultérieure et ont été complètement rechargés.

#### Une action sur les Traits échoue

Pour un joueur, un MJ actif est nécessaire. Le module refuse aussi l’action si le Trait a été supprimé, rendu persistant ou déplacé depuis l’ouverture de la fenêtre. Reouvrez alors **Traits temporaires** pour actualiser la liste.

#### Le contexte vide ferme la fenêtre sans envoyer

Mettez le module à jour en version `0.5.3` ou ultérieure. Le contexte est facultatif.

#### Une Compétence ou Motivation imposée reste modifiable

Vérifiez que les deux clients utilisent `0.5.3` ou une version ultérieure, puis rechargez-les complètement.

#### Le bouton Ouvrir le test reste après le résultat

Vérifiez que les deux clients utilisent `0.5.4` ou une version ultérieure et qu’un MJ est connecté. Dans la console MJ, cherchez :

```text
Dune QoL | Test request marked as completed.
```

#### Le joueur ne reçoit pas la demande

1. Vérifiez que les deux clients affichent la même version de Dune QoL.
2. Rechargez complètement la page des deux côtés.
3. Vérifiez que le joueur possède toujours le personnage.
4. Ouvrez l’onglet Chat côté joueur : un message privé doit être présent.
5. Côté MJ, cherchez `Dune QoL | Test request queued for user delivery.`.
6. Côté joueur, cherchez `Dune QoL | Test request received from user inbox.`.

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

### Test fields and result

Choose Skill, Drive, optional Focus, difficulty, total dice, complication range, extra-die source, optional Determination and optional context. The extra-die source becomes available from 3 dice onward.

Starting with `0.5.4`, each parameter occupies its own row in the narrow chat column. Success or failure color is used as an accent while the remaining text keeps the normal chat contrast.

### Applying Momentum and Threat

The result card proposes shared-pool changes. The pools are not changed until **Apply resource changes** is clicked.

A game master applies directly. A player sends the request to the active game master. The source message is marked as applied and a separate history card records before and after values.

Momentum spent on extra dice must already exist before the test. Generated Momentum cannot retroactively pay that cost. Final Momentum is capped at 6.

### Creating a Trait from a complication

A result with complications displays **Complication resolution**. The module creates one embedded upstream `trait` Item per resolved complication and records the result in chat. Player requests are executed by the active game master.

### Managing temporary Traits

Starting with version `0.6.0`, the Actor-sheet title bar provides **Temporary Traits** for the GM and Actor owner.

1. Open the Actor sheet.
2. Click **Temporary Traits**.
3. Select one or more listed Traits.
4. Choose **Make persistent** or **Delete**.

Only upstream `trait` Items whose `system.temporary` value is true are listed. Traits generated from complications display a **Complication** badge.

Player actions are executed by the active GM after permission and current-Item validation. A chat history lists the affected Traits. Promoting a generated Trait updates its source provenance when available. Deleting one does not reopen the resolved complication.

### Requesting a test as game master

Open the relevant Actor sheet and click **Request test**.

Choose a receiving player, set difficulty and complication range, and optionally enter context. For Skill and Drive:

- selecting a value makes it mandatory and locked in the player dialog;
- **Player chooses** leaves the field editable.

The proposed Focus remains editable. Requests are preserved in private chat and in a persistent inbox on the recipient User document.

### Completing a requested test

**Open test** remains available when the dialog is merely opened, closed or cancelled. It is removed only after the player rolls and the matching result ChatMessage exists. The active game master validates the request/result relationship and marks the request completed.

### Language

Open **Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL → Module language**, choose **English** or **Français**, then reload.

### Troubleshooting

Token controls require an active Scene. The extra-die source requires module `0.3.1` or newer and at least 3 dice. Empty request context and locked GM-selected Skill/Drive behavior require `0.5.3` or newer. Result-based request completion and the revised chat layout require `0.5.4` or newer. Temporary Trait management requires `0.6.0` or newer and an active GM for player actions.

For runtime errors, press **F12**, reproduce the issue and copy the complete console entry prefixed with `Dune QoL`.
