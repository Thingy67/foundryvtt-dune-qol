# Dune QoL — Guide utilisateur / User guide

Ce fichier est l’unique manuel utilisateur du module.

## Français

### Test guidé

Ouvrez une fiche compatible et cliquez sur **Test guidé**. Le module gère Compétence, Motivation, Spécialisation, difficulté, 2 à 5 dés, plage de complication, source des dés supplémentaires, Détermination et contexte facultatif.

Le résultat affiche les succès, complications, Momentum généré et actions associées. Les changements de Momentum et de Menace ne sont appliqués qu’après confirmation explicite.

### Complications et Traits

Une complication permet de créer un Item Dune natif de type `trait`, temporaire par défaut. Chaque complication ne peut être résolue qu’une fois. Supprimer ensuite le Trait ne rouvre pas la complication.

Depuis une fiche, **Traits temporaires** permet de sélectionner plusieurs Traits et de les rendre persistants ou de les supprimer. Une action effectuée par un joueur passe par le MJ actif.

### Demandes de test

Depuis une fiche, le MJ peut envoyer une demande individuelle au propriétaire du personnage.

Depuis les contrôles de token, **Demander un test groupé** permet de :

1. cocher un ou plusieurs joueurs ;
2. choisir explicitement le personnage utilisé par chacun ;
3. imposer ou laisser libres Compétence et Motivation ;
4. définir difficulté, complications, Spécialisation proposée et contexte ;
5. envoyer une demande indépendante à chaque destinataire.

Une demande reste ouverte tant qu’aucun résultat correspondant n’existe. Après le jet, **Ouvrir le test** disparaît uniquement pour le joueur ayant terminé sa demande.

### Feuille de groupe

À partir de `0.8.0`, le bouton **Feuille de groupe** est disponible dans les contrôles de token pour le MJ et les joueurs.

La fenêtre reste ouverte comme une application Foundry normale et contient plusieurs onglets.

#### Vue d’ensemble

Affiche les réserves collectives lorsqu’elles sont disponibles.

Le MJ peut enregistrer pour tout le monde :

- le nom et les informations de Maison ;
- l’état global du groupe ;
- les objectifs communs ;
- les notes du groupe.

Les joueurs voient ces informations en lecture seule.

#### Personnages

Les personnages possédés par les joueurs sont regroupés automatiquement :

- le personnage attribué à un utilisateur est principal par défaut ;
- les autres personnages possédés sont secondaires par défaut ;
- le MJ peut modifier ce classement et définir le rôle de chaque personnage.

Chaque carte affiche portrait, propriétaires, ressources individuelles détectées et quelques Traits.

Actions rapides :

- **Ouvrir la fiche** ;
- **Test** ;
- **Traits** ;
- **Sélectionner le token** sur la scène active.

#### Traits

Tous les Traits sont regroupés par personnage.

Le MJ peut sélectionner des Traits sur plusieurs personnages puis :

- rendre persistants les Traits temporaires sélectionnés ;
- supprimer les Traits sélectionnés.

La suppression de Traits persistants demande une confirmation. Un message d’historique récapitule les personnages et Traits concernés.

#### Demandes de test

Le tableau affiche les demandes visibles avec leur date, joueur, personnage, contexte et état :

- en attente ;
- terminée ;
- annulée.

Les filtres limitent l’affichage à un état. Les boutons permettent d’afficher dans le chat la demande ou son résultat. Le MJ peut annuler une demande en attente ; elle est alors retirée de la file de livraison et ne peut plus être validée par un résultat ultérieur.

### Gestion du combat

À partir de `0.9.0`, Dune QoL ajoute un suivi adapté à Dune au-dessus du Combat Tracker natif.

Il faut d’abord créer ou activer un Combat Foundry et y ajouter les tokens concernés.

Le panneau apparaît :

- dans le Combat Tracker ;
- dans l’onglet **Combat** de la Feuille de groupe.

Le suivi indique :

- le round ;
- le camp actif ;
- les combattants disponibles ou ayant déjà agi ;
- Momentum et Menace lorsqu’ils sont accessibles ;
- l’historique des actions.

Le MJ peut :

1. donner l’initiative aux personnages joueurs ou à l’opposition ;
2. sélectionner plusieurs combattants et les marquer comme ayant agi ;
3. rendre des combattants de nouveau disponibles ;
4. passer l’initiative à l’autre camp ;
5. conserver l’initiative avec un coût facultatif ;
6. réinitialiser les activations ;
7. passer au round suivant.

Pour **Conserver l’initiative**, le MJ saisit explicitement un coût entre 0 et 6 :

- le camp des joueurs dépense du Momentum ;
- l’opposition dépense de la Menace.

Le module vérifie la réserve avant de la modifier. Il n’impose pas automatiquement un coût de règle.

**Round suivant** utilise le Combat natif de Foundry, vide la liste des combattants ayant agi et redonne par défaut l’initiative aux joueurs. Une modification manuelle du round dans Foundry synchronise également le suivi.

Le bouton en forme de viseur sélectionne et centre le token du combattant.

### Langue et mise à jour

Dans **Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL → Langue du module**, choisissez **English** ou **Français**, puis rechargez.

Depuis le Setup Foundry, utilisez **Update**, puis rechargez complètement les clients.

### Dépannage

#### La Feuille de groupe ou les outils de groupe ne sont pas visibles

Une scène active et les contrôles de token sont nécessaires. Vérifiez que le module affiche au minimum `0.9.0`, puis rechargez complètement.

#### Un personnage n’apparaît pas

Il doit être possédé par au moins un joueur non-MJ et fournir les Compétences et Motivations du système Dune.

#### Sélectionner le token ne fonctionne pas

Le token du personnage doit exister sur la scène active.

#### Le panneau de combat indique qu’aucun combat n’est actif

Créez un Combat depuis le Combat Tracker, ajoutez les tokens, puis vérifiez que ce Combat est actif.

#### Un coût de conservation est refusé

La réserve de Momentum ou de Menace doit contenir au moins le montant saisi.

#### Une demande reste ouverte après un résultat

Dans la console MJ, cherchez :

```text
Dune QoL | Test request marked as completed.
```

Copiez toute erreur préfixée par `Dune QoL`.

---

## English

### Guided tests, pools and Traits

Use **Guided test** on a compatible Actor sheet. Shared Momentum and Threat changes require explicit confirmation. Complications may create native Dune `trait` Items. Deleting a generated Trait never reopens the original complication.

### Test requests

A GM may send one request from an Actor sheet or independent requests to several checked players from Token controls. Selected Skill and Drive values are mandatory; **Player chooses** remains editable. A request completes only after its matching result exists.

### Party Sheet

Starting with `0.8.0`, **Party Sheet** is available in Token controls to GMs and players.

It provides:

- shared House information, status, objectives and notes;
- Momentum and Threat display;
- primary and supporting characters;
- owners, roles, portraits and detected individual resources;
- quick Test, Traits, sheet and token actions;
- cross-Actor Trait management for the GM;
- pending, completed and cancelled request tracking;
- request/result chat navigation and request cancellation.

Only the GM can edit world-persistent information or perform group Trait changes.

### Combat management

Starting with `0.9.0`, a Dune combat panel appears in the native Combat Tracker and the Party Sheet Combat tab.

Create or activate a normal Foundry Combat first. The GM can then:

- choose the active side;
- mark selected combatants as acted or available;
- pass or retain initiative;
- enter an optional Momentum or Threat retention cost;
- reset activations;
- advance the native round;
- inspect combat history;
- select and pan to combatant tokens.

Players spend Momentum when their side retains initiative; the opposition spends Threat. The module validates the pool but does not impose a fixed rules cost.

### Language and troubleshooting

Choose the module language in **Game Settings → Configure Settings**, then reload. Party and combat controls require an active Scene. Combat tracking additionally requires an active native Foundry Combat.

For runtime errors, press **F12**, reproduce the issue and copy the complete console entry prefixed with `Dune QoL`.
