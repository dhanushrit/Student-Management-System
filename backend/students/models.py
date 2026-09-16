from django.conf import settings
from django.db import models


class Student(models.Model):
    YEAR_CHOICES = [
        (1, '1st Year'),
        (2, '2nd Year'),
        (3, '3rd Year'),
        (4, '4th Year'),
    ]

    # Each record remembers which logged-in user created it.
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='students')

    name = models.CharField(max_length=150)
    roll_number = models.CharField(max_length=30, unique=True)
    email = models.EmailField()
    department = models.CharField(max_length=100)
    year = models.PositiveSmallIntegerField(choices=YEAR_CHOICES)
    phone = models.CharField(max_length=15, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.roll_number} - {self.name}"
