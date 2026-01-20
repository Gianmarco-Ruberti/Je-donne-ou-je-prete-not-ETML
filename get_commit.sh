#!/bin/bash

# Config
SINCE="2026-01-13"
OUTPUT_DIR="Doc"
OUTPUT_FILE="$OUTPUT_DIR/commits_mardi_matin.csv"

# Sécurité : on crée le dossier proprement
mkdir -p "$OUTPUT_DIR"

echo "--- Scan de TOUTES les branches (Mardi matin depuis le $SINCE) ---"

# En-tête du CSV
echo "Hash,Branche,Auteur,Date,Jour,Heure,Message,Description" > "$OUTPUT_FILE"

# %h:hash, %D:branches, %an:auteur, %ad:date, %s:sujet, %b:corps
# On utilise \x1f (Unit Separator) comme délimiteur temporaire, c'est ultra safe.
git log --all --since="$SINCE" --date=format:'%Y-%m-%d|%A|%H:%M' --pretty=format:"%h%x1f%D%x1f%an%x1f%ad%x1f%s%x1f%b" | \
awk -F'\x1f' '{
    hash = $1;
    refs = $2;
    author = $3;
    split($4, d, "|"); # d[1]=Date, d[2]=Jour, d[3]=Heure
    subject = $5;
    body = $6;

    # Nettoyage propre de la branche
    gsub(/HEAD -> |, |tag: /, "", refs);
    split(refs, r, ",");
    branch = (r[1] == "") ? "N/A" : r[1];

    # Extraction de l heure pour le filtre
    hour = substr(d[3], 1, 2);

    # Filtre : Mardi (FR ou EN) ET avant midi
    if ((d[2] ~ /^[Tt]uesday/ || d[2] ~ /^[Mm]ardi/) && hour < 12) {
        
        # Fonction de nettoyage pour le CSV (enlève les virgules et sauts de ligne)
        gsub(/,/, " ", author);
        gsub(/,/, " ", branch);
        gsub(/,/, " ", subject);
        gsub(/,/, " ", body);
        gsub(/\n|\r/, " ", body);

        # Print final
        printf "%s,%s,%s,%s,%s,%s,%s,%s\n", hash, branch, author, d[1], d[2], d[3], subject, body
    }
}' >> "$OUTPUT_FILE"

echo "✅ Terminé ! Check ici : $OUTPUT_FILE"