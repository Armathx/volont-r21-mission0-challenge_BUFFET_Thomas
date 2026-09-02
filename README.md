# Poste Chef de groupe — Prototype candidat

Ce prototype simule une partie du poste Chef de groupe.

Votre mission est d'améliorer la façon dont le système informe le joueur de sa progression.

Lorsque les quatre conduites à tenir ont été validées, le système doit clairement passer dans un
nouvel état :

**CHEF DE GROUPE PRÊT**

et permettre ensuite de déclencher :

**RÉARTICULATION DU GROUPE**

## Ce que vous pouvez modifier

- l'interface ;
- les animations ;
- la structure du code ;
- les feedbacks ;
- les interactions ;
- le son ;
- ou tout élément qui vous paraît pertinent.

Nous préférons une amélioration simple et cohérente à une refonte spectaculaire.

**Temps indicatif : 20 à 30 minutes.**

L'utilisation d'outils d'IA est autorisée (Claude Code, ChatGPT, Copilot, ou autre).

## Lancer le prototype

Aucune installation nécessaire : ouvrez `index.html` dans un navigateur.

## Fichiers

- `index.html` — structure de la page
- `style.css` — styles
- `game.js` — logique du prototype (état des 4 scénarios, simulation de lecture RFID)

## État actuel (base fournie)

- 4 cartes de scénario (INTRUSION, INCENDIE, SECOURISME, INONDATION), chacune avec un état
  `À TRAITER`, `ERREUR` ou `VALIDÉ`.
- Un bouton « Lecture RFID » par carte simule la lecture d'un cube (résultat aléatoire, à des
  fins de démonstration uniquement).
- Une fois les 4 scénarios validés, un bloc "CHEF DE GROUPE PRÊT" apparaît avec un bouton
  "RÉARTICULATION DU GROUPE" — actuellement une simple alerte (`alert()`), volontairement
  minimale.

C'est précisément ce dernier point de transition (et plus généralement le feedback donné au
joueur tout au long du parcours) que nous vous invitons à améliorer.
