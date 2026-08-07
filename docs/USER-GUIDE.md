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

Tous les boutons **Demander un test** ouvrent désormais le même formulaire.

Le formulaire :

1. affiche tous les joueurs non-MJ ;
2. permet de cocher un ou plusieurs joueurs ;
3. permet de choisir explicitement le personnage utilisé pour chaque joueur compatible ;
4. affiche les joueurs sans personnage Dune compatible, mais leur case est désactivée ;
5. permet d’imposer ou de laisser libres Compétence et Motivation ;
6. permet de définir difficulté, plage de complication, Spécialisation proposée et contexte facultatif ;
7. crée une demande indépendante pour chaque destinataire sélectionné.

Depuis les contrôles de token, aucune case n’est cochée au départ.

Depuis une fiche de personnage, le formulaire est identique, mais le propriétaire le plus pertinent est précoché et le personnage de la ligne correspondante est prérempli avec la fiche ouverte. Si plusieurs joueurs possèdent le personnage, le joueur auquel ce personnage est directement attribué est privilégié ; à défaut, le premier propriétaire disponible est précoché. Le MJ peut ensuite modifier librement toute la sélection avant l’envoi.

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

Une scène active et les contrôles de token sont nécessaires. Vérifiez que le module affiche au minimum `0.9.4`, puis rechargez complètement.

#### Un joueur ne peut pas être coché dans Demander un test

Le joueur apparaît quand même dans la liste, mais il doit posséder au moins un personnage Dune compatible pour pouvoir recevoir une demande. Sans personnage compatible, sa case et son sélecteur de personnage restent désactivés.

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

Every **Request a test** launcher now opens the same form. It lists all non-GM players, allows one or several recipients to be checked, and provides an Actor selector for every eligible player. Players without a compatible Dune Actor remain visible but cannot be selected.

Opening the form from Token controls starts with no recipient selected. Opening it from an Actor sheet preselects the most relevant owner and that Actor; the GM can still change the entire selection before sending.

Selected Skill and Drive values are mandatory for recipients; **Player chooses** remains editable. Each selected recipient receives an independent request, and a request completes only after its matching result exists.

### Party Sheet

**Party Sheet** is available in Token controls to GMs and players. It provides shared House information, status, objectives and notes; Momentum and Threat; primary and supporting characters; quick actions; cross-Actor Trait management; and request tracking.

Only the GM can edit world-persistent information or perform group Trait changes.

### Combat

Starting with `0.9.3`, the module adds no combat-management UI or behavior. Foundry and the Dune system handle the Combat Tracker normally. The previous experimental combat layer was removed and may be reconsidered later as a separate incremental feature.

### Language and troubleshooting

Choose the module language in **Game Settings → Configure Settings**, then reload. Party controls require an active Scene.

For runtime errors, press **F12**, reproduce the issue and copy the complete console entry prefixed with `Dune QoL`.
