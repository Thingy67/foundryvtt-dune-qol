# Dune QoL — Guide utilisateur / User guide

Ce fichier est l’unique manuel utilisateur du module.

## Français

### Test guidé

Le système Dune fournit son propre lanceur. Dune QoL propose **Test guidé**, qui ajoute notamment la difficulté, le Momentum généré, la source des dés supplémentaires, la Détermination et des actions dans le résultat du chat.

Par défaut, ouvrez une fiche de personnage et cliquez sur **Test guidé**. Le réglage **Emplacement du test guidé** permet aussi d’utiliser les contrôles de token avec une scène active.

Champs disponibles :

- Compétence et Motivation du personnage ;
- Spécialisation facultative ;
- difficulté ;
- 2 à 5 dés ;
- plage de complication de 15 à 20 ;
- source des dés supplémentaires ;
- Détermination ;
- contexte facultatif.

Les résultats affichent une information par ligne afin de rester lisibles dans le chat.

### Momentum et Menace

Le résultat calcule les changements proposés. Les réserves ne changent qu’après un clic sur **Appliquer les changements**.

Le Momentum dépensé doit être disponible avant le jet. Le Momentum généré ne peut pas financer rétroactivement les dés supplémentaires. La réserve finale est plafonnée à 6.

### Complications et Traits

Une complication permet de créer un Item Dune natif de type `trait`, temporaire par défaut. Chaque complication ne peut être résolue qu’une fois. La suppression ultérieure du Trait ne rouvre pas la complication.

### Gérer les Traits temporaires

Depuis la fiche d’un personnage, cliquez sur **Traits temporaires**.

La fenêtre permet de :

1. sélectionner un ou plusieurs Traits ;
2. les rendre persistants ;
3. ou les supprimer.

Les Traits issus d’une complication sont signalés. Une action effectuée par un joueur passe par le MJ actif. Un message d’historique est créé.

### Demander un test individuel en tant que MJ

Depuis la fiche du personnage :

1. cliquez sur **Demander un test** ;
2. choisissez son propriétaire ;
3. définissez difficulté et plage de complication ;
4. saisissez éventuellement un contexte ;
5. imposez une Compétence ou une Motivation, ou laissez **Au choix du joueur** ;
6. proposez éventuellement une Spécialisation ;
7. envoyez la demande.

Une Compétence ou Motivation choisie par le MJ est verrouillée côté joueur. La demande reste disponible tant qu’aucun résultat correspondant n’a été créé. Après le jet, **Ouvrir le test** disparaît.

### Demander un test à plusieurs joueurs

À partir de la version `0.7.0`, le MJ dispose du bouton **Demander un test groupé** dans les contrôles de token.

1. Activez une scène.
2. Ouvrez les contrôles de token.
3. Cliquez sur **Demander un test groupé**.
4. Cochez un ou plusieurs joueurs.
5. Vérifiez le personnage utilisé par chaque joueur dans sa liste déroulante.
6. Définissez les paramètres communs du test.
7. Envoyez.

Une demande indépendante est créée pour chaque destinataire. Chaque joueur possède son propre message, sa propre file de livraison et son propre état de fin. Le résultat d’un joueur ne termine pas la demande des autres.

Les personnages attribués aux utilisateurs sont proposés en premier. Un autre personnage possédé peut être choisi explicitement.

### Voir tous les Traits du groupe

Le bouton **Voir les Traits du groupe**, dans les contrôles de token, ouvre une vue globale réservée au MJ.

Elle affiche pour chaque personnage joueur :

- le portrait ;
- les propriétaires ;
- tous les Traits ;
- l’état temporaire ou persistant ;
- l’origine « complication » lorsqu’elle est connue.

La recherche accepte un nom de joueur, de personnage ou de Trait. Un filtre permet d’afficher les personnages possédant des Traits temporaires ou persistants. Le bouton de fiche ouvre directement le personnage concerné.

Cette vue est en lecture seule. Les modifications restent accessibles depuis **Traits temporaires** sur la fiche individuelle.

### Langue

Dans **Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL → Langue du module**, choisissez **English** ou **Français**, puis rechargez.

### Dépannage

#### Les boutons de groupe ne sont pas visibles

Ils sont réservés au MJ, se trouvent dans les contrôles de token et nécessitent une scène active. Vérifiez que le module affiche au minimum la version `0.7.0`, puis rechargez complètement.

#### Un joueur n’apparaît pas dans la demande groupée

Il doit posséder au moins un personnage compatible fournissant les Compétences et Motivations Dune.

#### Un joueur ne reçoit pas sa demande

Vérifiez que les deux clients utilisent la même version, que le joueur possède toujours le personnage sélectionné et qu’un MJ est actif. Le message privé et la file persistante doivent permettre une réception après reconnexion.

#### Le bouton Ouvrir le test reste après le résultat

Dans la console MJ, cherchez :

```text
Dune QoL | Test request marked as completed.
```

Copiez toute erreur `Dune QoL | Test-request completion failed.`.

#### Mettre à jour

Depuis le Setup Foundry, utilisez **Update**, puis rechargez complètement la partie.

---

## English

### Guided test

Open a supported Actor sheet and click **Guided test**. The module adds difficulty, extra-die source, Determination, generated Momentum, complication handling and readable chat actions.

### Momentum, Threat and complication Traits

Shared pools change only after explicit confirmation. Momentum spent on extra dice must exist before the roll. A complication may create one native Dune `trait` Item and is then considered resolved.

### Temporary Trait manager

Use **Temporary Traits** on an Actor sheet to select one or several temporary Traits, make them persistent or delete them. Player actions are executed by the active GM and recorded in chat.

### Individual GM test request

Use **Request test** on the target Actor sheet. A selected Skill or Drive is mandatory and locked; **Player chooses** remains editable. The request completes only after the matching result exists.

### Group test request

Starting with `0.7.0`, a GM can use **Request a group test** in Token controls:

1. select one or several players with checkboxes;
2. verify the Actor assigned to each player;
3. set shared test parameters;
4. send independent requests.

Each recipient has a separate message, inbox entry and completion state.

### Party Trait overview

Use **View party Traits** in Token controls to display every compatible player-owned Actor, owners and all Traits. Search by player, Actor or Trait, filter by temporary or persistent state and open the Actor sheet directly.

The overview is read-only; use the individual Temporary Trait manager for changes.

### Language and troubleshooting

Choose the module language in **Game Settings → Configure Settings** and reload. Group buttons require an active Scene, GM permissions and module `0.7.0` or newer.

For runtime errors, press **F12**, reproduce the issue and copy the complete console entry prefixed with `Dune QoL`.
