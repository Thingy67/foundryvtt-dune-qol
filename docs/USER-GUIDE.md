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

Les boutons permettent d’afficher dans le chat la demande ou son résultat. Le MJ peut annuler une demande en attente après confirmation ; elle est retirée de la file de livraison et ne peut plus être validée par un résultat ultérieur.

### Combat

À partir de `0.9.3`, le module n’ajoute plus aucun outil de gestion du combat. Le Combat Tracker reste entièrement celui de Foundry et du système Dune.

Le suivi expérimental d’initiative, d’activations, de camps et de rounds des versions précédentes a été retiré. Ce sujet sera repris plus tard séparément et progressivement.

### Langue et mise à jour

Dans **Game Settings → Configure Settings → Dune: Adventures in the Imperium QoL → Langue du module**, choisissez **English** ou **Français**, puis rechargez.

Depuis le Setup Foundry, utilisez **Update**, puis rechargez complètement les clients.

### Dépannage

#### La Feuille de groupe ou les outils de groupe ne sont pas visibles

Une scène active et les contrôles de token sont nécessaires. Vérifiez que le module affiche au minimum `0.9.3`, puis rechargez complètement.

#### Un personnage n’apparaît pas

Il doit être possédé par au moins un joueur non-MJ et fournir les Compétences et Motivations du système Dune.

#### Sélectionner le token ne fonctionne pas

Le token du personnage doit exister sur la scène active.

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

**Party Sheet** is available in Token controls to GMs and players. It provides shared House information, status, objectives and notes; Momentum and Threat; primary and supporting characters; quick actions; cross-Actor Trait management; and request tracking.

Only the GM can edit world-persistent information or perform group Trait changes.

### Combat

Starting with `0.9.3`, the module adds no combat-management UI or behavior. Foundry and the Dune system handle the Combat Tracker normally. The previous experimental combat layer was removed and may be reconsidered later as a separate incremental feature.

### Language and troubleshooting

Choose the module language in **Game Settings → Configure Settings**, then reload. Party controls require an active Scene.

For runtime errors, press **F12**, reproduce the issue and copy the complete console entry prefixed with `Dune QoL`.
