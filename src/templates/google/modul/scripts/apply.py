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
    subprocess.Popen(args_init, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=os.environ['root'])

    return 'Success'

if __name__ == '__main__':
    RESP = main()
    print(RESP)
