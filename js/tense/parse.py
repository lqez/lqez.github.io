import requests
import csv
import json

with open('words_template.js') as infile:
    template = json.load(infile)

    for test in template:
        print('Processing', test['title'])
        if 'steps_split' in test:
            print('\tdownload and parse...')
            r = requests.get(test['url'])
            if r.status_code == requests.codes.ok:
                decoded_content = r.content.decode('utf-8')
                cr = csv.reader(decoded_content.splitlines(), delimiter=',')

                words = list(cr)
                length = len(words)

                c = test['skip_lines']
                while c < length:
                    test['steps'].append(words[c:c + test['steps_split']])
                    c += test['steps_split']

                print('\t', length - test['skip_lines'], 'words,', len(test['steps']), 'steps found.')


    with open('words.js', 'w') as outfile:
        outfile.write('const wordset = ')
        json.dump(template, outfile, indent=4, ensure_ascii=False)
