import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
import pandas as pd
import os

# 5 pts
class StockDataset(Dataset):
    def __init__(self, folder_path = 'stockdata', feature_cols=['Open', 'High', 'Low', 'Close', 'Volume']):
        """_summary_

        Args:
            folder_path (str, optional): _description_. Defaults to 'stockdata'.
            feature_cols (list, optional): _description_. Defaults to ['Open', 'High', 'Low', 'Close', 'Volume'].
        """
        # load all CSV files from the folder
        # concatenate them into a single DataFrame
        # any normalzation or other preprocessing should be done here

        self.samples = []
        self.labels = []
        self.tickers = []

        # load each CSV file from the folder
        for file_name in os.listdir(folder_path):
            if file_name.endswith('.csv'):
                ticker = file_name.replace('.csv', '')
                file_path = os.path.join(folder_path, file_name) # get file path of each csv file

                df = pd.read_csv(file_path) # read the CSV file

                df = df[feature_cols]

                # using min-max normalization to normalize each column to [0, 1]
                df = (df - df.min()) / (df.max() - df.min() + 1e-8)

                tensor = torch.tensor(df.values, dtype=torch.float32) # convert to tensor of shape

                self.samples.append(tensor)
                self.tickers.append(ticker)

    def __len__(self):
        """_summary_

        Returns:
            _type_: _description_
        """
        # return length of the input dataset
        return len(self.samples) 

    def __getitem__(self, idx):
        """_summary_

        Args:
            idx (_type_): _description_

        Returns:
            _type_: _description_
        """
        # return the stock data for the given index
        return self.samples[idx]

# 30 pts
class LSTMAutoencoder(nn.Module):
    def __init__(self, input_dim=5, hidden_dim=64, latent_dim=16, seq_len=23):
        """_summary_

        Args:
            input_dim (int, optional): _description_. Defaults to 5.
            hidden_dim (int, optional): _description_. Defaults to 64.
            latent_dim (int, optional): _description_. Defaults to 16.
            seq_len (int, optional): _description_. Defaults to 23.
        """
        super().__init__()
        self.seq_len = seq_len
        self.latent_dim = latent_dim

        # define the LSTM encoder and decoder

        # encoder: LSTM that compresses the input sequence
        self.encoder_lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True
        )

        self.encoder_fc = nn.Linear(hidden_dim, latent_dim) # linear layer map the last hidden state to the latent space

        # decoder to that reconstructs the input sequence from the latent representation

        self.decoder_fc = nn.Linear(latent_dim, hidden_dim) # linear layer to map the latent representation back to the hidden dimension

        # decoder LSTM and reconstructs the sequence
        self.decoder_lstm = nn.LSTM(
            input_size=hidden_dim,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True
        )

        # linear layer to project hidden state back to input space
        self.decoder_out = nn.Linear(hidden_dim, input_dim)


    def forward(self, x):
        """_summary_

        Args:
            x (_type_): _description_

        Returns:
            _type_: _description_
        """
        # implement the forward pass
        # return the reconstructed input and the latent representation

        # Encoder
        # pass input through encoder LSTM
        encoder_out, _ = self.encoder_lstm(x)

        # take the last timestep output as the context vector
        last_hidden = encoder_out[:, -1, :]

        # map to latent space
        latent = self.encoder_fc(last_hidden)

        # Decoder
        # map latent back to hidden dim
        decoder_input = self.decoder_fc(latent)

        # reconstruct the full sequence
        decoder_input = decoder_input.unsqueeze(1).repeat(1, self.seq_len, 1)

        # pass through decoder LSTM
        decoder_out, _ = self.decoder_lstm(decoder_input)

        # map back to input space
        reconstructed = self.decoder_out(decoder_out)

        return reconstructed, latent
    
# 10 pts
def train_autoencoder(model, dataloader, num_epochs=50, lr=5e-3):
    """_summary_

    Args:
        model (_type_): _description_
        dataloader (_type_): _description_
        num_epochs (int, optional): _description_. Defaults to 50.
        lr (_type_, optional): _description_. Defaults to 5e-3.
    """
    # define the training process

    optimizer = torch.optim.Adam(model.parameters(), lr=lr) # define the optimizer
    loss_fn = nn.MSELoss() # define the loss function, using the mean squared error

    model.train()

    # loop over epochs
    for epoch in range(num_epochs):
        total_loss = 0

        # loop over batches of data
        for batch in dataloader:
            optimizer.zero_grad() # zero the parameter gradients
        
            reconstructed, latent = model(batch) #forward pass, get reconstructed output and latent representation
           
            loss = loss_fn(reconstructed, batch) #compute reconstruction loss between input and reconstructed output
            
            loss.backward() #backward pass and compute gradients

            optimizer.step() # update model weights

            total_loss += loss.item()

        # Print average loss every 10 epochs
        avg_loss = total_loss / len(dataloader)
        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch + 1}/{num_epochs}, Loss: {avg_loss:.6f}")

# 5 pts
def get_latent(model, dataloader):
    """_summary_

    Args:
        model (_type_): _description_
        dataloader (_type_): _description_

    Returns:
        _type_: _description_
    """
    # Apply the model evaluation mode and return the latent representations
    
    model.eval()
    latent_representations = []

    with torch.no_grad():
        for batch in dataloader:
            # forward pass, get reconstructed output and latent representation
            _, latent = model(batch)
            latent_representations.append(latent)

    # concatenate all batches to a single tensor and convert to numpy
    latent_representations = torch.cat(latent_representations, dim=0).numpy()

    return latent_representations

# 0 pts 
# For testing your functions and classes, you can modify this based on your needs.
def test_submission():
    tickers = ['XOM', 'CVX', 'HAL', 'MMM', 'CAT', 'DAL', 'MCD', 'NKE', 'KO', 'JNJ', 
               'PFE', 'UNH', 'JPM', 'GS', 'BAC', 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']
    period = '2y'
    
    stock_data = fetch_stocks(tickers, period)
    save_stocks_to_csv(stock_data)
    
    dataset = StockDataset("stockdata")
    first_sample = dataset[0]
    
    seq_len = first_sample.shape[0]
    dataloader = DataLoader(dataset)

    model = LSTMAutoencoder(seq_len=seq_len)
    train_autoencoder(model, dataloader)

    Z = get_latent(model, dataloader)

if __name__ == '__main__':
    test_submission()