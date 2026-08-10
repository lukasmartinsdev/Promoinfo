from django.urls import include, path

urlpatterns = [path("", include("marketplace.urls"))]

handler404 = "marketplace.views.erro_404"
handler403 = "marketplace.views.erro_403"
