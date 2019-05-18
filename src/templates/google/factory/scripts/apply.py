import os
import json
import subprocess

def main():
    components = eval(os.environ['components'])
    includ = []
    for (k, v) in components.items():
        includ.append(k)
        args = ['terrahub', 'configure', '-i', k, '-c', "terraform.varFile[0]='" + str(v) + "'"]
        subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=os.environ['root'])
    includ = ','.join(includ)

    args_init = ['terrahub', os.environ['command'], '-i', includ, '-a', '-y']
    process = subprocess.Popen(args_init, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=os.environ['root'])
    (result, error) = process.communicate()

    process.wait()

    args_output = ['terrahub', 'output', '-o', 'json', '-i', includ, '-y']
    process = subprocess.Popen(args_output, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=os.environ['root'])
    (result, error) = process.communicate()

    rc = process.wait()

    if rc != 0:
        print("Error: failed to execute command:")
        print(error)
    
    
    response = {}
    for (key, val) in json.loads(result).items():
    	for (key_sub, val_sub) in val.items():
            response[key_sub]=val_sub['value']


    with open('output.json', 'wb') as json_file:
        json_file.write(json.dumps(response).encode("utf-8"))

    return 'Success'

if __name__ == '__main__':
    RESP = main()
    print(RESP)
