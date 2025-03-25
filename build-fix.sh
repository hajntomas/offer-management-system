#!/bin/bash
# Skript pro opravu buildu - instalace chybějících závislostí

# Přesunutí do frontendové složky
cd frontend

# Instalace lucide-react knihovny
echo "Instaluji lucide-react..."
npm install lucide-react --save

# Nyní můžeme spustit build
echo "Spouštím build..."
npm run build

echo "Build dokončen"
