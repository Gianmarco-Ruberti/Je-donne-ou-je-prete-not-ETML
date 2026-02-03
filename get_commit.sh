#!/bin/bash

# Config
SINCE="2026-01-13"
OUTPUT_DIR="Doc"
OUTPUT_FILE="$OUTPUT_DIR/commits_mardi_matin.csv"

mkdir -p "$OUTPUT_DIR"

echo "🚀 Scan des commits (Mardi matin uniquement) depuis le $SINCE..."

# En-tête du CSV
echo "Hash,Branche,Auteur,Date,Jour,Heure,Message,Description" > "$OUTPUT_FILE"

# On récupère les logs avec un séparateur spécial
git log --all --since="$SINCE" --date=format:'%Y-%m-%d|%A|%H:%M' --pretty=format:"%h%x1f%D%x1f%an%x1f%ad%x1f%s%x1f%b" | \
awk -F'\x1f' '
BEGIN { last_date = "" }
{
    hash = $1;
    refs = $2;
    author = $3;
    split($4, d, "|"); # d[1]=Date, d[2]=Jour, d[3]=Heure
    subject = $5;
    body = $6;

    # --- Gestion des Branches ---
    # On nettoie pour ne garder que le nom de la branche (ex: origin/main ou feature-x)
    gsub(/HEAD -> |tag: /, "", refs);
    split(refs, r, ", ");
    branch = (r[1] == "") ? "detached" : r[1];

    # --- Filtrage Mardi Matin ---
    hour = substr(d[3], 1, 2) + 0; # +0 force le type numérique
    is_tuesday = (d[2] ~ /^[Tt]uesday/ || d[2] ~ /^[Mm]ardi/);

    if (is_tuesday && hour < 12) {

        # --- Séparateur Créatif ---
        # Si on change de date, on insère une ligne "break" dans le CSV
        if (last_date != "" && last_date != d[1]) {
            print "---,---,---,---,---,---,---,---"
        }
        last_date = d[1];

        # --- Nettoyage CSV (Sécurité) ---
        gsub(/,/, " ", author);
        gsub(/,/, " ", branch);
        gsub(/,/, " ", subject);
        gsub(/,/, " ", body);
        gsub(/\n|\r/, " ", body);

        # Sortie finale
        printf "%s,%s,%s,%s,%s,%s,%s,%s\n", hash, branch, author, d[1], d[2], d[3], subject, body
    }
}' >> "$OUTPUT_FILE"

echo "✨ C’est dans la boîte ! Le fichier est prêt : $OUTPUT_FILE"
