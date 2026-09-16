from django.contrib import admin
from .models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('roll_number', 'name', 'department', 'year', 'email', 'owner', 'created_at')
    search_fields = ('name', 'roll_number', 'email', 'department')
    list_filter = ('department', 'year')
