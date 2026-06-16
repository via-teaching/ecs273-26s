import json
import os

data_directory = "../data/stocknews"

if __name__ == '__main__':
    try:
        output_obj = {}

        folders_unfiltered = os.listdir(data_directory)
        folders = list(filter(lambda item: os.path.isdir(data_directory + '/' + item), folders_unfiltered))

        for folder in folders:
            files_unfiltered = os.listdir(data_directory + '/' + folder)

            files = list(filter(lambda item: os.path.isfile(data_directory + '/' + folder + '/' + item), files_unfiltered))
            files = list(filter(lambda item: item.endswith('.txt'), files))

            output_obj[folder] = files
        
        with open(data_directory + '/filenames.json', 'w') as file:
            json.dump(output_obj, file)

        print(f'Saved all file names for {len(folders)} total tickers')

    except FileNotFoundError:
        print("Error: A requested file was not found")
    except Exception as exe:
        print('Unexpected exception occoured:')
        print(exe)