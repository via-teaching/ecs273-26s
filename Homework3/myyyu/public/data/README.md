# Homework 3 Data Folder

This folder follows the data layout described in `HW3-Description.docx.md`.

The files in this folder are imported from the local Homework 1 and Homework 2 outputs:

- `stockdata/<TICKER>.csv` - copied from `D:\Github\ecs273\assignment1\hw1-skeleton\stockdata`.
- `stocknews/<TICKER>/news.json` - converted from `D:\Github\ecs273\assignment1\hw1-skeleton\stocknews\<TICKER>\*.txt`.
- `tsne.csv` - regenerated with the same latent LSTM autoencoder t-SNE workflow defined in `D:\Github\ecs273\assignment2\HW2\T2\script.py`.

Run `scripts/import-real-hw-data.py` from the app folder if the HW1 or HW2 outputs change.
