#!/usr/bin/env python3
"""
Script de test pour vérifier un token Moodle
Usage: python test_moodle_token.py
"""

import requests
import sys

def test_moodle_token():
    """Test un token Moodle"""
    
    print("=" * 60)
    print("🧪 TEST TOKEN MOODLE")
    print("=" * 60)
    print()
    
    # Demander les informations
    moodle_url = input("URL Moodle (ex: https://moodle.umontpellier.fr): ").strip()
    token = input("Token Moodle: ").strip()
    
    if not moodle_url or not token:
        print("❌ URL ou token manquant")
        return
    
    # Enlever le / final
    moodle_url = moodle_url.rstrip('/')
    
    print()
    print("🔄 Test en cours...")
    print()
    
    # Test 1: mod_assign_get_assignments
    endpoint = f"{moodle_url}/webservice/rest/server.php"
    params = {
        'wstoken': token,
        'wsfunction': 'mod_assign_get_assignments',
        'moodlewsrestformat': 'json'
    }
    
    try:
        response = requests.get(endpoint, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        print("📡 Réponse API Moodle:")
        print("-" * 60)
        
        # Vérifier les erreurs Moodle
        if 'exception' in data or 'errorcode' in data:
            print(f"❌ ERREUR MOODLE:")
            print(f"   Code: {data.get('errorcode', 'Unknown')}")
            print(f"   Message: {data.get('message', 'Unknown error')}")
            print()
            
            # Aide selon l'erreur
            if data.get('errorcode') == 'invalidtoken':
                print("💡 SOLUTION:")
                print("   Le token est invalide. Utilisez cette URL pour obtenir le bon token:")
                print(f"   {moodle_url}/login/token.php?username=VOTRE_LOGIN&password=VOTRE_PASSWORD&service=moodle_mobile_app")
                print()
                print("   Remplacez VOTRE_LOGIN et VOTRE_PASSWORD par vos identifiants.")
                
            elif 'webservice' in data.get('errorcode', ''):
                print("💡 SOLUTION:")
                print("   Les webservices ne sont pas activés ou accessibles.")
                print("   Contactez le support IT de votre université.")
                
            elif 'accessexception' in data.get('errorcode', ''):
                print("💡 SOLUTION:")
                print("   Votre token n'a pas accès à la fonction mod_assign_get_assignments.")
                print("   Utilisez le token de l'app mobile Moodle.")
            
            print()
            return
        
        # Succès !
        if 'courses' in data:
            print("✅ TOKEN VALIDE !")
            print()
            print(f"📚 Cours trouvés: {len(data['courses'])}")
            
            total_assignments = 0
            for course in data['courses']:
                assignments = course.get('assignments', [])
                total_assignments += len(assignments)
                if assignments:
                    print(f"   - {course.get('shortname', 'Unknown')}: {len(assignments)} devoirs")
            
            print()
            print(f"📝 Total devoirs: {total_assignments}")
            print()
            
            if total_assignments == 0:
                print("⚠️  Aucun devoir trouvé. C'est normal si vous n'avez pas de devoirs actifs.")
            else:
                print("✅ Le token fonctionne parfaitement !")
                print("   Vous pouvez maintenant l'utiliser dans StudyFlow.")
            
        else:
            print("⚠️  Réponse inattendue:")
            print(data)
        
        print()
        
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT:")
        print("   Le serveur Moodle ne répond pas.")
        print("   Vérifiez l'URL et votre connexion internet.")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ ERREUR RÉSEAU:")
        print(f"   {str(e)}")
        print()
        print("   Vérifiez que l'URL Moodle est correcte.")
        
    except Exception as e:
        print(f"❌ ERREUR:")
        print(f"   {str(e)}")
    
    print()
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_moodle_token()
    except KeyboardInterrupt:
        print("\n\n⏸️  Test annulé")
        sys.exit(0)
