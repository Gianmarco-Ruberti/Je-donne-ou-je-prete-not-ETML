#!/bin/bash

# Configuration
SINCE="2026-01-13"
OUTPUT_FILE="Doc/commits_mardi_matin.csv"

echo "--- Scan de TOUTES les branches (Mardi matin depuis le $SINCE) ---"

# En-tête du CSV
echo "Hash,Auteur,Jour,Heure,Message" > "$OUTPUT_FILE"

# --all : scanne toutes les refs (branches, tags, etc.)
# sort -u : supprime les doublons si un commit est sur plusieurs branches
git log --all --since="$SINCE" --date=format:'%A %H:%M' --pretty=format:"%h|%an|%ad|%s" | \
sort -u | \
awk -F'|' '{
    split($3, date_parts, " ");
    day = date_parts[1];
    hour_min = date_parts[2];
    hour = substr(hour_min, 1, 2);

    # Filtrage : Mardi et avant 12h
    if ((day ~ /[Tt]uesday/ || day ~ /[Mm]ardi/) && hour < 12) {
        hash = $1;
        author = $2;
        message = $4;

        # Nettoyage des virgules pour le CSV
        gsub(/,/, " ", author);
        gsub(/,/, " ", message);

        print hash "," author "," day "," hour_min "," message
    }
}' >> "$OUTPUT_FILE"

echo "Scan complet terminé ! Fichier : $OUTPUT_FILE"
