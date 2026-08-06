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

Le bouton **Feuille de groupe** est disponible dans les contrôles de token pour le MJ et les joueurs.

#### Vue d’ensemble

Le MJ peut enregistrer pour tout le monde :

- le nom et les informations de Maison ;
- l’état global du groupe ;
- les objectifs communs ;
- les notes du groupe.

Les réserves collectives sont affichées lorsqu’elles sont disponibles. Les joueurs voient les informations partagées en lecture seule.

#### Personnages

Les personnages possédés par les joueurs sont regroupés automatiquement :

- le personnage attribué à un utilisateur est principal par défaut ;
- les autres personnages possédés sont secondaires par défaut ;
- le MJ peut modifier ce classement et définir le rôle de chaque personnage.

Chaque carte affiche portrait, propriétaires, ressources individuelles détectées et quelques Traits.

Actions rapides : **Ouvrir la fiche**, **Test**, **Traits** et **Sélectionner le token**.

#### Traits

Tous les Traits sont regroupés par personnage. Le MJ peut sélectionner des Traits sur plusieurs personnages puis :

- rendre persistants les Traits temporaires sélectionnés ;
- supprimer les Traits sélectionnés.

La suppression de Traits persistants demande une confirmation. Un message d’historique récapitule les personnages et Traits concernés.

#### Demandes de test

Le tableau affiche les demandes avec leur date, joueur, personnage, contexte et état : en attente, terminée ou annulée.

Les boutons permettent d’afficher dans le chat la demande ou son résultat. Le MJ peut annuler une demande en attente ; elle est retirée de la file de livraison et ne peut plus être validée par un résultat ultérieur.

### Gestion du combat

À partir de `0.9.1`, Dune QoL ajoute un suivi adapté à Dune au-dessus du Combat Tracker natif.

Créez ou activez d’abord un Combat Foundry et ajoutez-y les tokens concernés. Le panneau apparaît dans le Combat Tracker et dans l’onglet **Combat** de la Feuille de groupe.

Le suivi indique le round, le camp actif, les combattants disponibles ou ayant déjà agi, les réserves accessibles et l’historique.

Le MJ peut :

1. donner l’initiative aux personnages joueurs ou à l’opposition ;
2. sélectionner plusieurs combattants et les marquer comme ayant agi ;
3. rendre des combattants de nouveau disponibles ;
4. passer l’initiative à l’autre camp ;
5. conserver l’initiative ;
6. réinitialiser les activations ;
7. passer au round suivant.

#### Conserver l’initiative

Le coût proposé est **2**, mais le MJ peut saisir un nombre entier de 0 à 6 pour gérer les exceptions.

Pour le camp des joueurs, le MJ choisit le paiement :

- dépenser du Momentum ;
- ajouter autant de Menace.

Pour l’opposition, le coût est dépensé depuis la réserve de Menace. Le module vérifie la réserve lorsqu’une dépense est nécessaire et enregistre le paiement dans l’historique.

Un même camp ne peut pas conserver l’initiative deux fois de suite. Après une conservation, le bouton reste verrouillé pour ce camp jusqu’à ce qu’un combattant du camp adverse soit marqué comme ayant agi. Le verrou est également supprimé lors d’une réinitialisation ou d’un nouveau round.

**Round suivant** utilise le Combat natif de Foundry, vide la liste des combattants ayant agi et redonne par défaut l’initiative aux joueurs. Une modification manuelle du round synchronise également le suivi.

Le bouton en forme de viseur sélectionne et centre le token du combattant.

### Langue et mise à jour

Dans **Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL → Langue du module**, choisissez **English** ou **Français**, puis rechargez.

Depuis le Setup Foundry, utilisez **Update**, puis rechargez complètement les clients.

### Dépannage

#### La Feuille de groupe ou les outils de groupe ne sont pas visibles

Une scène active et les contrôles de token sont nécessaires. Vérifiez que le module affiche au minimum `0.9.1`, puis rechargez complètement.

#### Un personnage n’apparaît pas

Il doit être possédé par au moins un joueur non-MJ et fournir les Compétences et Motivations du système Dune.

#### Sélectionner le token ne fonctionne pas

Le token du personnage doit exister sur la scène active.

#### Le panneau de combat indique qu’aucun combat n’est actif

Créez un Combat depuis le Combat Tracker, ajoutez les tokens, puis vérifiez que ce Combat est actif.

#### Le paiement de conservation est refusé

Le coût doit être un entier de 0 à 6. Une dépense de Momentum ou de Menace nécessite une réserve suffisante. L’option **Ajouter de la Menace** n’exige pas de réserve préalable.

#### Conserver l’initiative reste désactivé

Le même camp a déjà conservé l’initiative. Marquez au moins un combattant adverse comme ayant agi, ou réinitialisez les activations.

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

**Party Sheet** is available in Token controls to GMs and players. It provides shared House information, status, objectives and notes; Momentum and Threat; primary and supporting characters; quick actions; cross-Actor Trait management; request tracking; and a Combat tab.

Only the GM can edit world-persistent information or perform group Trait changes.

### Combat management

Starting with `0.9.1`, a Dune combat panel appears in the native Combat Tracker and the Party Sheet Combat tab.

Create or activate a normal Foundry Combat first. The GM can choose the active side, mark combatants acted or available, pass or retain initiative, reset activations, advance the native round, inspect history, and select tokens.

The suggested retention cost is **2**, editable from 0 to 6. Player retention may spend Momentum or add Threat. Opposition retention spends Threat.

After a side retains initiative, that same side cannot retain again until an opposing combatant is marked as acted. Resetting activations or advancing the round clears the lock.

### Language and troubleshooting

Choose the module language in **Game Settings → Configure Settings**, then reload. Party and combat controls require an active Scene. Combat tracking additionally requires an active native Foundry Combat.

For runtime errors, press **F12**, reproduce the issue and copy the complete console entry prefixed with `Dune QoL`.
