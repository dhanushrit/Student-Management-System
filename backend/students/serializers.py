import re

from rest_framework import serializers

from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Student
        fields = [
            'id', 'name', 'roll_number', 'email', 'department',
            'year', 'phone', 'owner', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Name cannot be empty.")
        return value.strip()

    def validate_roll_number(self, value):
        if not value.strip():
            raise serializers.ValidationError("Roll number cannot be empty.")
        return value.strip()

    def validate_phone(self, value):
        if value and not re.fullmatch(r'\d{7,15}', value):
            raise serializers.ValidationError("Phone number must contain 7-15 digits only.")
        return value
