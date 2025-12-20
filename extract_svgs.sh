#!/bin/bash

find . -name "*.hbs" -type f | while read -r file; do
  if grep -q "<svg" "$file"; then
    sed -n '/<svg/,/<\/svg>/p' "$file" | awk 'BEGIN{RS="</svg>"} {if (length($0)>0) print $0 "</svg>"}' | while read -r svg; do
      if [[ "$svg" =~ \<svg ]]; then
        title="Replace inline SVG in $file"
        desc="Replace the following inline SVG with icon helper: $svg"
        bd create --title "$title" --description "$desc" --priority 0 --silent
      fi
    done
  fi
done