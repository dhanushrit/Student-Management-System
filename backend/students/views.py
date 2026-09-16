from django.db.models import Q
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError

from .models import Student
from .serializers import StudentSerializer


class StudentViewSet(viewsets.ModelViewSet):
    """
    Provides list, retrieve, create, update, partial_update, destroy
    for the Student entity (i.e. full CRUD), scoped to the logged-in user.

    Supports ?search=<text> to filter by name, roll number, or department.
    """
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Student.objects.filter(owner=self.request.user)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(roll_number__icontains=search) |
                Q(department__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        # Extra safety net beyond DB-level unique constraint / serializer validation.
        roll_number = serializer.validated_data.get('roll_number')
        if roll_number:
            clash = Student.objects.filter(roll_number=roll_number).exclude(pk=self.get_object().pk)
            if clash.exists():
                raise ValidationError({"roll_number": "A student with this roll number already exists."})
        serializer.save()
