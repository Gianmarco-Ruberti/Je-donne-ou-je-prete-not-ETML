#!/bin/bash

# Configuration
SINCE="2026-01-13"
OUTPUT_FILE="Doc/commits_mardi_matin.csv"

# Créer le dossier Doc s'il n'existe pas
mkdir -p Doc

echo "--- Scan de TOUTES les branches (Mardi matin depuis le $SINCE) ---"

# En-tête du CSV
echo "Hash,Branche,Auteur,Date,Jour,Heure,Message,Description" > "$OUTPUT_FILE"

# %h: hash, %D: ref names (branches), %an: auteur, %ad: date, %s: sujet, %b: body
git log --all --since="$SINCE" --date=format:'%Y-%m-%d|%A|%H:%M' --pretty=format:"%h¤%D¤%an¤%ad¤%s¤%b" | \
sort -u | \
awk -F'¤' '{
    hash = $1;
    refs = $2;
    author = $3;
    split($4, date_parts, "|");
    full_date = date_parts[1];
    day = date_parts[2];
    hour_min = date_parts[3];
    subject = $5;
    body = $6;

    # Nettoyage du nom de la branche (on prend la première info pertinente)
    # On enlève "HEAD -> ", "tag: ", etc.
    gsub(/HEAD -> /, "", refs);
    split(refs, ref_list, ",");
    branch = ref_list[1];
    if (branch == "") branch = "N/A";

    hour = substr(hour_min, 1, 2);

    # Filtrage : Mardi et avant 12h
    if ((day ~ /[Tt]uesday/ || day ~ /[Mm]ardi/) && hour < 12) {
        
        # Nettoyage CSV
        gsub(/,/, " ", author);
        gsub(/,/, " ", branch);
        gsub(/,/, " ", subject);
        gsub(/,/, " ", body);
        gsub(/\n/, " ", body);
        gsub(/\r/, "", body);

        print hash "," branch "," author "," full_date "," day "," hour_min "," subject "," body
    }
}' >> "$OUTPUT_FILE"

echo "Scan complet terminé ! Fichier : $OUTPUT_FILE"
