from dataclasses import fields
import json
from os import environ
import os

from subprocess import Popen, PIPE
from rest_framework import viewsets, serializers, status
from rest_framework.decorators import action

from django.contrib.auth.models import User
from django.http import HttpRequest, HttpResponse


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username"]

class AssemblyViewSet(viewsets.ModelViewSet):
    # TODO: Change from User model to a Assembly model (it could be used to store user codes and examples)
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=['POST'])
    def validate(self, request) -> HttpResponse:
        body = json.loads(request.body.decode('utf-8'))
        assembly = body['assembly']
        if assembly is None:
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        return validate_assembly(assembly=assembly)

def validate_assembly(assembly: str) -> HttpResponse:
    """
    Validate the assembly code using the crosscompiler installed on the server
    """

    # Save the assembly code to a temporary file
    filename = "/tmp/assembly.S"
    with open(filename, 'w') as f:
        f.write(assembly)

    # Run the crosscompiler on the assembly code
    ccenv = os.environ.copy()
    ccenv["LANG"] = "en"
    armcc = Popen(['arm-linux-gnueabihf-as', '-mthumb', filename, '-o', filename.replace(".S", ".o")], stdout=PIPE, stderr=PIPE, env=ccenv)
    out, err = armcc.communicate()

    response_data = {
        'compiled': False,
        'message': '',
    }

    if armcc.returncode == 0:
        response_data['compiled'] = True
        response_data['message'] = 'Compilation successful.' + err.decode().replace(filename, "input.S")
        return HttpResponse(json.dumps(response_data), content_type='application/json', status=status.HTTP_200_OK)
    else:
        response_data['message'] = err.decode().replace(filename, "input.S")
        return HttpResponse(json.dumps(response_data), content_type='application/json', status=status.HTTP_200_OK)