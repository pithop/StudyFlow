# StudyFlow - Guide de test Upload

## Fonctionnalité d'Import

L'onglet "Importer" permet d'ajouter des tâches depuis deux sources :

### 1. Import PDF (Syllabus)
- **Endpoint**: `/v1/extract-deadlines`
- **Usage**: Analyse un PDF de syllabus pour détecter automatiquement les deadlines
- **Comment tester**:
  1. Va dans l'onglet "Importer" de l'app
  2. Clique sur "Importer un PDF"
  3. Sélectionne un fichier PDF contenant des dates et deadlines
  4. L'API va parser le texte et créer des tâches avec les deadlines détectées
  5. Va dans "Mes Tâches" pour voir les nouvelles tâches créées

### 2. Import Calendar (.ics)
- **Endpoint**: `/v1/import-ics`
- **Usage**: Importe des événements depuis un fichier calendrier iCal
- **Comment tester**:
  1. Exporte un calendrier depuis Google Calendar, Outlook, ou Moodle (Format: .ics)
  2. Va dans l'onglet "Importer"
  3. Clique sur "Importer un .ics"
  4. Sélectionne le fichier .ics
  5. Tous les événements (VEVENT) et tâches (VTODO) seront importés comme tâches avec type='calendar'
  6. Va dans "Mes Tâches" pour voir les nouvelles tâches

### Exemples de fichiers test

#### Créer un fichier .ics de test
Crée un fichier `test.ics` avec ce contenu :
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//StudyFlow//Test//EN
BEGIN:VEVENT
UID:test1@studyflow
DTSTART:20251120T140000Z
DTEND:20251120T160000Z
SUMMARY:Examen de Mathématiques
DESCRIPTION:Examen final chapitre 1-5
END:VEVENT
BEGIN:VEVENT
UID:test2@studyflow
DTSTART:20251125T100000Z
SUMMARY:Rendu Projet Informatique
END:VEVENT
BEGIN:VTODO
UID:todo1@studyflow
SUMMARY:Réviser cours de Physique
DUE:20251122T180000Z
END:VTODO
END:VCALENDAR
```

#### PDF de test
Crée un fichier texte avec des dates et sauvegarde-le en PDF :
```
Calendrier du cours - Automne 2025

- 20 novembre 2025: Examen partiel
- 25 novembre 2025: Remise du projet final
- 1er décembre 2025: Présentation orale
- 10 décembre 2025: Examen final
```

### Notes importantes
- Les imports utilisent automatiquement ton compte Supabase authentifié
- Les tâches importées apparaissent immédiatement dans "Mes Tâches"
- Les tâches PDF ont type='exam', 'homework', ou 'project' (selon détection)
- Les tâches .ics ont type='calendar'
- L'upload fonctionne même sans connexion réseau côté Supabase (fallback user_id)

### Débogage
Si l'import échoue :
1. Vérifie que le backend est bien démarré (`uvicorn main:app --host 0.0.0.0 --port 5050`)
2. Vérifie que `icalendar` est installé (`pip install icalendar`)
3. Regarde les logs du backend pour voir les erreurs
4. Assure-toi que le fichier a la bonne  (.pdf ou .ics)
extension